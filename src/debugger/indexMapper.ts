type Index = number | string;

interface Map {
  id?: number;
  children: Record<Index, Map>;
}

/**
 * Mapping between arrays and numbers. Useful for creating variableReferences, frameIds and whatnot.
 */
export class IndexMapper {
  private toSingle: Map = { children: {} };
  private toMultiple: Record<number, Index[]> = [];
  private nextId: number = 1;

  public upsertArray(indices: Index[]): number {
    const id = this.addToMap(this.toSingle, indices);
    this.toMultiple[id] = indices;
    return id;
  }

  public getArray(id: number): Index[] {
    return this.toMultiple[id].slice();
  }

  private addToMap(map: Map, indices: Index[]): number {
    if (indices.length === 0) {
      map.id = map.id || this.nextId++;
      return map.id;
    } else {
      const newMap = (map.children[indices[0]] = map.children[indices[0]] || { children: {} });
      return this.addToMap(newMap, indices.slice(1));
    }
  }
}
