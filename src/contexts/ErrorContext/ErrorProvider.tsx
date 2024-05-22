'use client'

import React, { type ReactNode, useCallback, useState } from 'react'
import { ErrorContext, type ErrorInfo } from '@/contexts/ErrorContext/ErrorContext'
import ErrorWindow from '@/components/ui/ErrorWindow'

interface ErrorProviderProps {
	children: ReactNode
}

const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
	const [errors, setErrors] = useState<ErrorInfo[]>([])

	const addError = useCallback((error: unknown) => {
		setErrors(prevErrors => [...prevErrors, { id: Date.now(), error }])
	}, [])

	const removeError = useCallback((id: number) => {
		setErrors(prevErrors => prevErrors.filter(error => error.id !== id))
	}, [])

	return (
		<ErrorContext.Provider value={{ errors, addError, removeError }}>
			{children}
			<div className="fixed top-5 right-0 flex flex-col z-50">
				{errors.map((error) => (
					<ErrorWindow key={error.id} error={error.error} onClose={() => {
						removeError(error.id)
					}} />
				))}
			</div>
		</ErrorContext.Provider>
	)
}

export default ErrorProvider
