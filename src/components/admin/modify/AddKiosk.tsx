import EditableField from '@/components/admin/modify/ui/EditableField'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { type ActivityType, type KioskType } from '@/types/backendDataTypes'
import axios from 'axios'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import Activities from './kioskActivities/Activities'
import ActivitiesWindow from './ActivitiesWindow'

const Kiosk = ({
	activities,
	onKioskPosted,
	onClose
}: {
	activities: ActivityType[]
	onKioskPosted: (kiosk: KioskType) => void
	onClose: () => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const { addError } = useError()

	const [kiosk, setKiosk] = useState<Omit<KioskType, '_id'>>({
		name: '',
		kioskTag: '',
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

	const postKiosk = useCallback((kiosk: Omit<KioskType, '_id'>): void => {
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

	const handleKioskTagChange = useCallback((v: string): void => {
		setKiosk({
			...kiosk,
			kioskTag: v
		})
	}, [kiosk])

	const handlePasswordChange = useCallback((v: string): void => {
		setKiosk({
			...kiosk,
			password: v
		})
	}, [kiosk])

	const handleAddActivity = useCallback((v: ActivityType): void => {
		setKiosk({
			...kiosk,
			activities: [...kiosk.activities, v]
		})
	}, [kiosk])

	const handleDeleteActivity = useCallback((v: ActivityType): void => {
		setKiosk({
			...kiosk,
			activities: kiosk.activities.filter((activity) => activity !== v)
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
								fieldName='name'
								placeholder='Navn'
								italic={false}
								minSize={10}
								required={true}
								editable={true}
								onChange={(v: string) => {
									handleNameChange(v)
								}}
								validations={[{
									validate: (v: string) => v.length <= 20,
									message: 'Navn må maks være 20 tegn'
								}]}
								onValidationChange={(fieldName: string, v: boolean) => {
									handleValidationChange(fieldName, v)
								}}
							/>
						</div>
						<div className="font-bold p-2 text-gray-800">
							<EditableField
								fieldName='kioskTag'
								placeholder='Kiosk tag'
								italic={false}
								minSize={10}
								required={true}
								editable={true}
								onChange={(v: string) => {
									handleKioskTagChange(v)
								}}
								validations={[{
									validate: (v: string) => v.length <= 20,
									message: 'Kiosk tag må maks være 20 tegn'
								}]}
								onValidationChange={(fieldName: string, v: boolean) => {
									handleValidationChange(fieldName, v)
								}}
							/>
						</div>
						<div className="font-bold p-2 text-gray-800">
							<EditableField
								fieldName='password'
								placeholder='Password'
								italic={false}
								minSize={10}
								required={true}
								editable={true}
								onChange={(v: string) => {
									handlePasswordChange(v)
								}}
								validations={[{
									validate: (v: string) => v.length <= 20,
									message: 'Password må maks være 20 tegn'
								}]}
								onValidationChange={(fieldName: string, v: boolean) => {
									handleValidationChange(fieldName, v)
								}}
							/>
						</div>
						{kiosk.activities.length > 0 &&
							<p className="italic text-gray-500 pt-2">{'Aktiviteter:'}</p>
						}
						{kiosk.activities.length === 0 &&
							<p className="italic text-gray-500 pt-2">{'Tilføj Aktiviteter:'}</p>
						}
						<Activities
							selectedActivities={kiosk.activities}
							editable={true}
							onDeleteActivity={(v: ActivityType) => {
								handleDeleteActivity(v)
							}}
							showActivities={() => {
								setShowActivities(true)
							}}
						/>
						{showActivities &&
							<ActivitiesWindow
								kioskName={kiosk.name}
								activities={activities}
								kioskActivities={kiosk.activities}
								onAddActivity={(v: ActivityType) => {
									handleAddActivity(v)
								}}
								onDeleteActivity={(v: ActivityType) => {
									handleDeleteActivity(v)
								}}
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
