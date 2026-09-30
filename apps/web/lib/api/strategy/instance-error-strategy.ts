import type { ErrorResult, IErrorStrategy } from "../intefaces/interfaces";

type HttpErrorClass<E extends Error & { code: number }> = new (...args: never[]) => E;

export class InstanceErrorStrategy<E extends Error & { code: number }> implements IErrorStrategy<E> {
    constructor(private readonly errorClass: HttpErrorClass<E>) { }

    supports(error: unknown): error is E {
        return error instanceof this.errorClass;
    }

    handle(error: E): ErrorResult {
        return { message: error.message, code: error.code };
    }
}
