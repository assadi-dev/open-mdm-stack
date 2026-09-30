import type { ErrorResult, IErrorStrategy } from "../intefaces/interfaces";

export class ErrorContextStrategy {
    constructor(
        private readonly strategies: IErrorStrategy[],
        private readonly fallback: IErrorStrategy,
    ) { }

    handle(error: unknown): ErrorResult {
        for (const strategy of this.strategies) {
            if (strategy.supports(error)) {
                return strategy.handle(error);
            }
        }
        return this.fallback.handle(error);
    }
}
