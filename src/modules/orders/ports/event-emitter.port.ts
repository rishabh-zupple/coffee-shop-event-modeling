import type { DomainEvent } from '../domain/order.types.js';

export interface EventEmitterPort {
  emit(event: DomainEvent): void;
}
