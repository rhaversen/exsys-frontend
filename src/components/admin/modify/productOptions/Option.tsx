import React, { type ReactElement } from 'react'
import Image from 'next/image'
import { type OptionType } from '@/lib/backendDataTypes'

const Option = ({
	option,
	editable,
	onDelete
}: {
	option: OptionType
	editable: boolean
	onDelete: (v: OptionType) => void
}): ReactElement => {
	return (
		<div className="flex items-center justify-between w-auto bg-gray-200 text-black m-1 rounded-full px-2 py-1">
			<p className="text-center text-sm font-semibold">{option.name}</p>
			{editable && (
				<button
					type="button"
					className="cursor-pointer"
					onClick={() => {
						onDelete(option)
					}}
				>
					<p className='sr-only'>Delete</p>
					<Image
						src="/admin/modify/trashcan.svg"
						alt="Delete"
						width={15}
						height={15}
					/>
				</button>
			)}
		</div>
	)
}

export default Option
