export class PaginationResult<T> {
  checklistTrue: T[];
  checklistFalse: T[];
  total: number;
  pageTrue: number;
  pageFalse: number;
  pageSize: number;
  totalPagesTrue: number;
  totalPagesFalse: number;

  constructor(
    checklistTrue: T[],
    checklistFalse: T[],
    total: number,
    pageTrue: number,
    pageFalse: number,
    pageSize: number,
    totalPagesTrue: number,
    totalPagesFalse: number
  ) {
    this.checklistTrue = checklistTrue;
    this.checklistFalse = checklistFalse;
    this.total = total;
    this.pageTrue = pageTrue;
    this.pageFalse = pageFalse;
    this.pageSize = pageSize;
    this.totalPagesTrue = totalPagesTrue;
    this.totalPagesFalse = totalPagesFalse;
  }
}
