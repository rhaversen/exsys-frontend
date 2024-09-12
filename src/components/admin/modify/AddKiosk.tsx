import EditableField from '@/components/admin/modify/ui/EditableField'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type ActivityType, type KioskType, type PostKioskType, type ReaderType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import ActivitiesWindow from './ActivitiesWindow'
import Activities from './kioskActivities/Activities'
import EditableDropdown from './ui/EditableDropdown'

const Kiosk = ({
	kiosks,
	activities,
	readers,
	onKioskPosted,
	onClose
}: {
	kiosks: KioskType[]
	activities: ActivityType[]
	readers: ReaderType[]
	onKioskPosted: (kiosk: KioskType) => void
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [kiosk, setKiosk] = useState<PostKioskType>({
		readerId: '',
		name: '',
		kioskTag: undefined,
		password: '',
		activities: []
	})
	const [showActivities, setShowActivities] = useState(false)
	const [fieldValidations, setFieldValidations] = useState<Record<string, boolean>>({})
	const [formIsValid, setFormIsValid] = useState(false)

	// Update formIsValid when fieldValidations change
	useEffect(() => {
		const formIsValid = Object.values(fieldValidations).every((v) => v)
		setFormIsValid(formIsValid)
	}, [fieldValidations])

	const handleValidationChange = useCallback((fieldName: string, v: boolean): void => {
		setFieldValidations((prev) => {
			return {
				...prev,
				[fieldName]: v
			}
		})
	}, [])

	const postKiosk = useCallback((kiosk: PostKioskType): void => {
		axios.post(API_URL + '/v1/kiosks', kiosk, { withCredentials: true }).then((response) => {
			onKioskPosted(response.data as KioskType)
			onClose()
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, onKioskPosted, onClose, addError])

	const handleNameChange = useCallback((v: string): void => {
		setKiosk({
			...kiosk,
			name: v
		})
	}, [kiosk])

	const handlePasswordChange = useCallback((v: string): void => {
		setKiosk({
			...kiosk,
			password: v
		})
	}, [kiosk])

	const handleKioskTagChange = useCallback((v: KioskType['kioskTag']): void => {
		setKiosk({
			...kiosk,
			kioskTag: (v === '') ? undefined : v as any
		})
	}, [kiosk])

	const handleAddActivity = useCallback((v: ActivityType): void => {
		setKiosk({
			...kiosk,
			activities: [...kiosk.activities, v._id]
		})
	}, [kiosk])

	const handleDeleteActivity = useCallback((v: ActivityType): void => {
		setKiosk({
			...kiosk,
			activities: kiosk.activities.filter((activity) => activity !== v._id)
		})
	}, [kiosk])

	const handleReaderIdChange = useCallback((v: string): void => {
		setKiosk({
			...kiosk,
			readerId: v === 'null-option' ? undefined : v
		})
	}, [kiosk])

	const handleCancelPost = useCallback((): void => {
		onClose()
	}, [onClose])

	const handleCompletePost = useCallback((): void => {
		postKiosk(kiosk)
	}, [postKiosk, kiosk])

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black/50 z-10">
			<button
				type="button"
				className="absolute inset-0 w-full h-full"
				onClick={onClose}
			>
				<span className="sr-only">
					{'Close'}
				</span>
			</button>
			<div className="absolute bg-white rounded-3xl p-10">
				<div className="flex flex-col items-center justify-center">
					<div className="flex flex-col items-center justify-center">
						<p className="text-gray-800 font-bold text-xl pb-5">{'Ny Kiosk'}</p>
						<div className="font-bold p-2 text-gray-800">
							<EditableField
								fieldName="name"
								placeholder="Navn"
								italic={false}
								minSize={10}
								required={true}
								editable={true}
								onChange={handleNameChange}
								maxLength={50}
								onValidationChange={handleValidationChange}
							/>
						</div>
						<div className="font-bold p-2 text-gray-800">
							<EditableField
								fieldName="password"
								placeholder="Password"
								italic={false}
								minSize={10}
								required={true}
								editable={true}
								onChange={handlePasswordChange}
								minLength={4}
								maxLength={100}
								onValidationChange={handleValidationChange}
							/>
						</div>
						<div className="font-bold p-2 text-gray-800">
							<EditableField
								fieldName="tag"
								placeholder="Tag (Automatisk)"
								italic={false}
								minSize={15}
								editable={true}
								onChange={handleKioskTagChange}
								minLength={5}
								maxLength={5}
								validations={[{
									validate: (v: string) => v === '' || !kiosks.some((k) => k.kioskTag === v),
									message: 'Kortlæser tag er allerede i brug'
								}]}
								type="number"
								onValidationChange={handleValidationChange}
							/>
						</div>
						<p className="italic text-gray-500">{'Kortlæser'}</p>
						<EditableDropdown
							options={readers.map((reader) => ({
								value: reader._id,
								label: reader.readerTag
							}))}
							initialValue={kiosk.readerId ?? 'null-option'}
							onChange={handleReaderIdChange}
							editable={true}
							fieldName="readerId"
							placeholder="Vælg Kortlæser"
							allowNullOption={true}
							onValidationChange={handleValidationChange}
						/>
						{kiosk.activities.length > 0 &&
							<p className="italic text-gray-500 pt-2">{'Aktiviteter:'}</p>
						}
						{kiosk.activities.length === 0 &&
							<p className="italic text-gray-500 pt-2">{'Tilføj Aktiviteter:'}</p>
						}
						<Activities
							selectedActivities={activities.filter((activity) => kiosk.activities.includes(activity._id))}
							editable={true}
							onDeleteActivity={handleDeleteActivity}
							showActivities={() => {
								setShowActivities(true)
							}}
						/>
						{showActivities &&
							<ActivitiesWindow
								kioskName={kiosk.name}
								activities={activities}
								kioskActivities={activities.filter((activity) => kiosk.activities.includes(activity._id))}
								onAddActivity={handleAddActivity}
								onDeleteActivity={handleDeleteActivity}
								onClose={() => {
									setShowActivities(false)
								}}
							/>
						}
					</div>
				</div>
				<div className="flex flex-row justify-center gap-4 pt-5">
					<button
						type="button"
						className="bg-red-500 hover:bg-red-600 text-white rounded-md py-2 px-4"
						onClick={handleCancelPost}
					>
						{'Annuller'}
					</button>
					<button
						type="button"
						disabled={!formIsValid}
						className={`${formIsValid ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-200'} text-white rounded-md py-2 px-4`}
						onClick={handleCompletePost}
					>
						{'Færdig'}
					</button>
				</div>
			</div>
		</div>
	)
}

export default Kiosk
