'use client'

import React, { type ReactElement, useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import Products from '@/components/order/Products'
import SubmitButton from '@/components/ui/SubmitButton'
import { convertOrderWindowFromUTC, isCurrentTimeInOrderWindow } from '@/lib/timeUtils'
import RoomSelector from '@/components/order/RoomSelector'
import DeliveryTimeSelector from '@/components/order/DeliveryTimeSelector'
import { type ProductType, type RoomType } from '@/lib/backendDataTypes'

export default function Page (): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [products, setProducts] = useState<ProductType[]>([])
	const [quantities, setQuantities] = useState<Record<string, number>>({})
	const [availabilities, setAvailabilities] = useState<Record<string, boolean>>({})
	const [rooms, setRooms] = useState<RoomType[]>([])
	const [selectedRoomId, setSelectedRoomId] = useState<string>('')
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())
	const [formIsValid, setFormIsValid] = useState(false)

	const fetchProducts = useCallback(async () => {
		const response = await axios.get(API_URL + '/v1/products')
		const products = response.data as ProductType[]
		setProducts(products)
		const quantities = products.reduce(
			(acc: Record<string, number>, product) => ({
				...acc,
				[product._id]: 0
			}),
			{}
		)
		setQuantities(quantities)
	}, [API_URL, setProducts, setQuantities])

	const updateAvailabilities = useCallback(() => {
		const availabilities = products.reduce(
			(acc: Record<string, boolean>, product) => ({
				...acc,
				[product._id]: isCurrentTimeInOrderWindow(convertOrderWindowFromUTC(
					product.orderWindow
				))
			}),
			{}
		)
		setAvailabilities(availabilities)
	}, [products, setAvailabilities])

	const fetchRooms = useCallback(async () => {
		const response = await axios.get(API_URL + '/v1/rooms')
		const rooms = response.data as RoomType[]
		setRooms(rooms)
	}, [API_URL, setRooms])

	useEffect(() => {
		if (API_URL === undefined || API_URL === null) return
		fetchRooms().catch((error) => { console.error('Error fetching rooms:', error) })
		fetchProducts().catch((error) => { console.error('Error fetching products:', error) })
	}, [API_URL, fetchRooms, fetchProducts])

	useEffect(() => {
		updateAvailabilities()
	}, [products, updateAvailabilities])

	useEffect(() => {
		const productSelected = Object.values(quantities).some((quantity) => quantity > 0)
		const roomSelected = selectedRoomId !== ''
		const dateSelected = selectedDate !== null
		setFormIsValid(productSelected && roomSelected && dateSelected)
	}, [quantities, selectedRoomId, selectedDate])

	const handleDateSelect = (date: Date): void => {
		setSelectedDate(date)
	}

	const handleQuantityChange = (key: string, newQuantity: number): void => {
		setQuantities((prevQuantities) => ({
			...prevQuantities,
			[key]: newQuantity
		}))
	}

	const handleRoomSelect = (roomId: string): void => {
		setSelectedRoomId(roomId)
	}

	const submitOrder = (): void => {
		const productsArray = Object.entries(quantities).map(
			([product, quantity]) => ({
				id: product,
				quantity
			})
		)

		const data = {
			requestedDeliveryDate: selectedDate.toISOString(),
			products: productsArray,
			roomId: selectedRoomId
		}

		console.log(data)

		axios.post(API_URL + '/v1/orders', data).catch((error) => {
			console.error('Failed to submit order:', error)
		})
	}

	return (
		<main className="bg-white flex flex-col h-screen overflow-hidden mx-auto shadow-lg max-w-screen-lg">
			<div className="overflow-auto">
				<Products
					products={products}
					quantities={quantities}
					availabilities={availabilities}
					onQuantityChange={handleQuantityChange}
				/>
			</div>
			<div className="mt-auto">
				<div className="flex justify-center mt-4">
					<RoomSelector
						rooms={rooms}
						onRoomSelect={handleRoomSelect}
					/>
					<DeliveryTimeSelector
						selectedDate={selectedDate}
						onDateSelect={handleDateSelect}
					/>
				</div>
				<SubmitButton
					text="Bestil"
					onClick={submitOrder}
					disabled={!formIsValid}
				/>
			</div>
		</main>
	)
}
