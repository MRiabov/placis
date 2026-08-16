/** Minimal StrEnum base: singleton instances that compare by string value. */
export class StrEnum {
  readonly value: string;

  protected constructor(value: string) {
    this.value = value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: StrEnum | string): boolean {
    return this.value === String(other);
  }
}
