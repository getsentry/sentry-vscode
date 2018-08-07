import { CancellationTokenSource, QuickPickItem, window } from 'vscode';

import { configuration } from '../config';
import { listProjects, Project } from '../sentry';
import { SentryCommand } from './base';

export const COMMAND_SHOW_PROJECT_PICK = 'sentry.showProjectPick';

async function withCancellation<T>(
  cancellation: CancellationTokenSource,
  func: () => Promise<T[]>,
): Promise<T[]> {
  try {
    return await func();
  } catch (e) {
    cancellation.cancel();
    window.showErrorMessage(`Could not load projects: ${e}`);
    return [];
  } finally {
    cancellation.dispose();
  }
}

function compareProjects(a: Project, b: Project): -1 | 0 | 1 {
  if (a.organization.slug < b.organization.slug) {
    return -1;
  }
  if (a.organization.slug > b.organization.slug) {
    return 1;
  }

  if (a.team.slug < b.team.slug) {
    return -1;
  }
  if (a.team.slug > b.team.slug) {
    return 1;
  }

  if (a.slug < b.slug) {
    return -1;
  }
  if (a.slug > b.slug) {
    return 1;
  }

  return 0;
}

interface ProjectQuickPickItem extends QuickPickItem {
  id: string;
}

async function loadProjects(): Promise<ProjectQuickPickItem[]> {
  const projects = await listProjects();
  projects.sort(compareProjects);

  return projects.map(project => ({
    description: `#${project.team.slug}`,
    id: `${project.organization.slug}/${project.slug}`,
    label: `${project.organization.slug} / ${project.slug}`,
  }));
}

export class ShowProjectPickCommand extends SentryCommand<void> {
  public constructor() {
    super(COMMAND_SHOW_PROJECT_PICK);
  }

  protected async run(): Promise<void> {
    const cancellation = new CancellationTokenSource();
    const projects = withCancellation(cancellation, loadProjects);

    // TODO: Create multi select here
    const pick = await window.showQuickPick(
      projects,
      {
        matchOnDescription: true,
        matchOnDetail: true,
        placeHolder: 'Please select your Sentry project',
      },
      cancellation.token,
    );

    if (pick) {
      configuration.setProjects([pick.id]);
    }
  }
}

export const showProjectPick = new ShowProjectPickCommand();
