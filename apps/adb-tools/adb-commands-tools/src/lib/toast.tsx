import { toast } from "sonner"


export const toastSuccess = (message: string) => {
    toast.success(message)

}

export const toastError = (message: string) => {
    toast.error(message)
}

export const toastPromise = (promise: Promise<any>, message: string, onSuccess: (data: any) => string, onError: (error: any) => string) => {
    toast.promise(promise, {
        loading: message,
        success: (data: any) => onSuccess(data),
        error: (error: any) => onError(error),
    })
}