'use client'

import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { convertOrderWindowFromUTC } from '@/lib/timeUtils'
import CartWindow from '@/components/orderstation/cart/CartWindow'
import SelectionWindow from '@/components/orderstation/select/SelectionWindow'
import { type CartType, type OptionType, type ProductType, type RoomType } from '@/lib/backendDataTypes'
import OrderConfirmationWindow from '@/components/orderstation/confirmation/OrderConfirmationWindow'
import { useInterval } from 'react-use'
import { useRouter } from 'next/navigation'

export default function Page ({ params }: Readonly<{ params: { room: RoomType['_id'] } }>): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const router = useRouter()

	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [cart, setCart] = useState<CartType>({
		products: {},
		options: {}
	})
	const [formIsValid, setFormIsValid] = useState(false)
	const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
	const [orderStatus, setOrderStatus] = useState<'success' | 'error' | 'loading'>('loading')
	const [price, setPrice] = useState(0)

	const fetchProductsAndOptions = useCallback(async () => {
		const productsResponse = await axios.get(API_URL + '/v1/products')
		const products = productsResponse.data as ProductType[]
		products.forEach((product) => {
			product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
		})
		setProducts(products)
		const optionsResponse = await axios.get(API_URL + '/v1/options')
		const options = optionsResponse.data as OptionType[]
		setOptions(options)
	}, [API_URL, setProducts, setOptions])

	const validateRoomAndRedirect = useCallback(() => {
		axios.get(API_URL + '/v1/rooms/' + params.room).catch(() => {
			router.push('/orderstation')
		})
	}, [API_URL, params.room, router])

	// Fetch products and options on mount
	useEffect(() => {
		if (API_URL === undefined) return
		fetchProductsAndOptions().catch((error) => {
			console.error('Error fetching products and options:', error)
		})
	}, [API_URL, fetchProductsAndOptions])

	// Check if the room is valid
	useEffect(() => {
		if (API_URL === undefined) return
		validateRoomAndRedirect()
	}, [router, API_URL, validateRoomAndRedirect, params.room])

	// Check if any product is selected
	useEffect(() => {
		const productSelected = Object.values(cart.products).some((quantity) => quantity > 0)
		setFormIsValid(productSelected)
	}, [cart])

	// Calculate total price
	useEffect(() => {
		const price = (
			Object.entries(cart.products).reduce((acc, [_id, quantity]) => acc + (products.find(product => product._id === _id)?.price ?? 0) * quantity, 0) +
			Object.entries(cart.options).reduce((acc, [_id, quantity]) => acc + (options.find(option => option._id === _id)?.price ?? 0) * quantity, 0)
		)
		setPrice(price)
	}, [cart, options, products])

	useInterval(fetchProductsAndOptions, 1000 * 60 * 60) // Fetch products and options every hour
	useInterval(validateRoomAndRedirect, 1000 * 60 * 60) // Validate room every hour

	const handleCartChange = useCallback((_id: ProductType['_id'] | OptionType['_id'], type: 'products' | 'options', change: number): void => {
		// Copy the cart object
		const newCart = { ...cart }
		// If the item is not in the cart, add it with a quantity of 0
		if (newCart[type][_id] === undefined) newCart[type][_id] = 0
		// Change the quantity of the item
		newCart[type][_id] += change
		// If the quantity is 0 or less, remove the item from the cart
		if (newCart[type][_id] <= 0) {
			newCart[type] = Object.entries(newCart[type]).reduce<CartType[typeof type]>((acc, [key, value]) => {
				// If the item is not the one to remove, add it to the accumulator
				if (key !== _id) acc[key] = value
				return acc
			}, {})
		}
		setCart(newCart)
	}, [cart, setCart])

	const submitOrder = useCallback((): void => {
		setOrderStatus('loading')
		setShowOrderConfirmation(true)

		const productCart = Object.entries(cart.products).map(
			([item, quantity]) => ({
				id: item,
				quantity
			})
		)

		const optionCart = Object.entries(cart.options).map(
			([item, quantity]) => ({
				id: item,
				quantity
			})
		)

		const data = {
			roomId: params.room,
			products: productCart,
			options: optionCart
		}

		console.log(data)

		axios.post(API_URL + '/v1/orders', data).then(() => {
			setOrderStatus('success')
		}).catch((error) => {
			setOrderStatus('error')
			console.error(error)
		})
	}, [API_URL, cart, params.room, setOrderStatus, setShowOrderConfirmation])

	const reset = useCallback((): void => {
		setCart({
			products: {},
			options: {}
		})
		setShowOrderConfirmation(false)
		setOrderStatus('loading')
	}, [setCart, setShowOrderConfirmation, setOrderStatus])

	return (
		<main>
			<div className="flex h-screen">
				<div className="flex-1 overflow-y-auto">
					<SelectionWindow
						products={products}
						options={options}
						handleCartChange={handleCartChange}
					/>
				</div>
				<div className="w-[300px] h-screen overflow-y-auto">
					<CartWindow
						price={price}
						products={products}
						options={options}
						cart={cart}
						onCartChange={handleCartChange}
						onSubmit={submitOrder}
						formIsValid={formIsValid}
					/>
				</div>
			</div>
			<div>
				{showOrderConfirmation &&
					<OrderConfirmationWindow
						price={price}
						orderStatus={orderStatus}
						onClose={reset}
					/>}
			</div>
		</main>
	)
}
