

export class ErrorContextStrategy {



    constructor() { }

    start(error: unknown) {
        if (error.name === "Unauthorized") { }

    }



}
