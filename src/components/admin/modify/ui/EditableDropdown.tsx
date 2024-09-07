import React, { useEffect, useState, type ReactElement } from 'react'

interface Option {
	value: string
	label: string
}

const Dropdown = ({
	options,
	initialValue,
	onChange,
	title,
	editable = true,
	placeholder,
	onValidationChange,
	fieldName,
	allowNullOption = false
}: {
	options: Option[]
	initialValue?: string
	onChange: (value: string) => void
	title?: string
	editable?: boolean
	placeholder?: string
	fieldName?: string
	onValidationChange?: (fieldName: string, isValid: boolean) => void
	allowNullOption?: boolean
}): ReactElement => {
	const [selectedValue, setSelectedValue] = useState<string>(initialValue ?? '')

	const handleChange = (value: string): void => {
		onChange(value)
		setSelectedValue(value)
		if (onValidationChange !== undefined && fieldName !== undefined) {
			if (value !== '') {
				onValidationChange(fieldName, true)
			} else {
				onValidationChange(fieldName, false)
			}
		}
	}

	// Notify parent component when validation changes
	useEffect(() => {
		if (onValidationChange !== undefined && fieldName !== undefined) {
			onValidationChange(fieldName, false)
		}
	}, [fieldName, onValidationChange])

	// Reset text when no longer editable
	useEffect(() => {
		if (!editable) {
			setSelectedValue(initialValue ?? '')
		}
	}, [editable, initialValue])


	return (
		<div className="font-bold pb-2 text-gray-800">
			{editable
				? (
					<select
						className="border-2 border-blue-500 bg-transparent rounded-md p-2 focus:outline-none"
						value={selectedValue.length > 0 ? selectedValue : ''}
						onChange={(e) => { handleChange(e.target.value) }}
						title={title}
					>
						{(placeholder != null) && (
							<option disabled value="">
								{placeholder}
							</option>
						)}
						{allowNullOption && (
							<option value="null-option">
								{'Intet'}
							</option>
						)}
						{options.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				)
				: (
					<p className="p-0 m-0 text-center border-0 cursor-text focus:outline-none w-auto">
						{options.find((option) => option.value === selectedValue)?.label ?? 'Intet'}
					</p>
				)}
		</div>
	)
}

export default Dropdown
