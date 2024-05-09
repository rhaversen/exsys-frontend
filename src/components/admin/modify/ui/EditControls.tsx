import React, { type ReactElement } from 'react'
import Image from 'next/image'

const EditingControls = ({
	isEditing,
	setIsEditing,
	handleUndoEdit,
	handleCompleteEdit,
	setShowDeleteConfirmation
}: {
	isEditing: boolean
	setIsEditing: (isEditing: boolean) => void
	handleUndoEdit: () => void
	handleCompleteEdit: () => void
	setShowDeleteConfirmation: (show: boolean) => void
}): ReactElement => {
	if (isEditing) {
		return (
			<div className="flex flex-row">
				<button
					onClick={() => {
						setShowDeleteConfirmation(true)
					}}
					type="button"
					className="w-5 h-5"
				>
					<span className="sr-only">Delete</span>
					<Image
						width={20}
						height={20}
						className="w-full h-full"
						src="/admin/modify/trashcan.svg"
						alt="Delete"
					/>
				</button>
				<button
					onClick={handleUndoEdit}
					type="button"
					className="w-10 h-10"
				>
					<span className="sr-only">Undo changes</span>
					<Image
						width={40}
						height={40}
						className="w-full h-full"
						src="/admin/modify/undo.svg"
						alt="Undo"
					/>
				</button>
				<button
					onClick={handleCompleteEdit}
					type="button"
					className="w-10 h-10"
				>
					<span className="sr-only">Complete changes</span>
					<Image
						width={40}
						height={40}
						className="w-full h-full"
						src="/admin/modify/checkmark.svg"
						alt="Accept"
					/>
				</button>
			</div>
		)
	} else {
		return (
			<button
				onClick={() => {
					setIsEditing(true)
				}}
				type="button"
				className="w-10 h-10"
			>
				<Image
					width={40}
					height={40}
					className="w-full h-full"
					src="/admin/modify/pen.svg"
					alt="Edit"
				/>
				<span className="sr-only">Edit</span>
			</button>
		)
	}
}

export default EditingControls
