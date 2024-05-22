import { AxiosError } from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

const ErrorWindow = ({
	error,
	onClose
}: {
	error: unknown
	onClose: () => void
}): ReactElement => {
	const timeOut = 5000
	const errorBounceIn = 100

	const [timeoutAnimation, setTimeoutAnimation] = useState(false)
	const [showError, setShowError] = useState(false)

	const errorMessage = ((): string => {
		if (error === undefined || error === null) return ''
		if (typeof error === 'string') return error
		if (typeof error === 'object') {
			if (error instanceof AxiosError) {
				if (error.response?.data !== undefined && error.response?.data !== '') return error.response.data.error
				if (error.message !== undefined && error.message !== '') return error.message
				return JSON.stringify(error)
			}
			if (error instanceof Error) return error.message
		}
		return JSON.stringify(error)
	})()

	const handleClose = useCallback((): void => {
		setShowError(false)
		setTimeout(() => {
			onClose()
		}, errorBounceIn)
	}, [onClose, setShowError])

	const handleStartTimeout = useCallback((): void => {
		setTimeoutAnimation(true)
		const timeoutId = setTimeout(handleClose, timeOut)
		setTimeOutId(timeoutId)
	}, [timeOut, handleClose, setTimeOutId, setTimeoutAnimation])

	useEffect(() => {
		setShowError(true)
		handleStartTimeout()
	}, [handleStartTimeout, setShowError])

	return (
		<div
			className={`mb-2 rounded-l-lg shadow-lg bg-red-800 z-50 origin-right ${showError ? `translate-x-0 transition-transform duration-[${errorBounceIn}ms] ease-out` : `translate-x-full transition-transform duration-[${errorBounceIn}ms] ease-in`}`}
			role="alert"
		>
			<div className="flex flex-row p-2">
				<div className="flex flex-col justify-center items-center">
					<h1 className="text-xl font-bold text-white">Der skete en fejl</h1>
					<p className="text-lg text-white">{errorMessage}</p>
				</div>
				<button
					type="button"
					className="text-3xl p-3"
					onClick={handleClose}
				>
					X
				</button>
			</div>
			<div
				className={`ml-1 rounded-l h-1 bg-white transition-transform ${timeoutAnimation ? 'duration-[5000ms]' : 'duration-0'} origin-right ease-linear transform ${timeoutAnimation && 'translate-x-full'}`}/>
		</div>
	)
}

export default ErrorWindow
