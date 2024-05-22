import Image from 'next/image'
import { type OptionType } from '@/lib/backendDataTypes'
import React, { type ReactElement } from 'react'

const Option = ({
	option,
	onOptionSelect
}: {
	option: OptionType
	onOptionSelect: (option: OptionType) => void
}): ReactElement => {
	return (
		<div className="p-2 m-2 relative">
			<button
				type="button"
				className="cursor-pointer"
				onClick={() => {
					onOptionSelect(option)
				}}
				draggable="false"
			>
				<div className="flex flex-row items-center justify-center">
					<h3 className={'font-bold pr-2 text-gray-800'}>{option.name}</h3>
					<p className={'italic text-gray-800'}>
						{option.price === 0 ? 'Gratis' : `${option.price} kr`}
					</p>
				</div>
				<Image
					width={100}
					height={100}
					quality={80}
					src={`${option.imageURL === undefined || option.imageURL === '' ? '/none.svg' : option.imageURL}`}
					alt={option.name}
					className="w-48 h-48 object-cover text-gray-800"
					draggable="false"
					priority // Load image immediately
				/>
			</button>
		</div>
	)
}

export default Option
