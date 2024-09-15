import React, { type ReactElement } from 'react'

const AmountIndicator = ({
	amount
}: {
	amount: number
}): ReactElement => {
	return (
		<div
			className="w-10 h-10 z-50 bg-blue-500 rounded-full border-2 border-blue-600 flex justify-center items-center">
			<h3 className="text-2xl text-white">
				{amount}
			</h3>
		</div>
	)
}

export default AmountIndicator
