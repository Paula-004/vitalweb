export interface ApiResponse<T> {
  data: T
  meta: { requestId: string; timestamp: string }
}

export class DataSourceError extends Error {
  constructor(message: string, public readonly status?: number, public readonly cause?: unknown) {
    super(message)
    this.name = 'DataSourceError'
  }
}

export class NotFoundError extends DataSourceError {
  constructor(resource: string, id: string) {
    super(`${resource} con identificador ${id} no fue encontrado.`, 404)
    this.name = 'NotFoundError'
  }
}
