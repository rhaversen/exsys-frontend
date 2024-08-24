'use client'

import CartWindow from '@/components/orderstation/cart/CartWindow'
import SelectPaymentWindow from '@/components/orderstation/cart/SelectPaymentWindow'
import OrderConfirmationWindow from '@/components/orderstation/confirmation/OrderConfirmationWindow'
import SelectionWindow from '@/components/orderstation/select/SelectionWindow'
import { useError } from '@/contexts/ErrorContext/ErrorContext'
import { convertOrderWindowFromUTC } from '@/lib/timeUtils'
import { type KioskTypeNonPopulated, type ActivityType, type OptionType, type ProductType, type OrderType } from '@/types/backendDataTypes'
import { type CartType } from '@/types/frontendDataTypes'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'
import { useInterval } from 'react-use'

export default function Page ({ params }: Readonly<{ params: { activity: ActivityType['_id'] } }>): ReactElement {
	const API_URL = process.env.NEXT_PUBLIC_API_URL
	const router = useRouter()
	const { addError } = useError()

	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [cart, setCart] = useState<CartType>({
		products: {},
		options: {}
	})
	const [formIsValid, setFormIsValid] = useState(false)
	const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
	const [orderStatus, setOrderStatus] = useState<'success' | 'error' | 'loading' | 'awaitingPayment'>('loading')
	const [price, setPrice] = useState(0)
	const [activityName, setActivityName] = useState('')
	const [numberOfActivities, setNumberOfActivities] = useState(0)
	const [kioskId, setKioskId] = useState('')
	const [showSelectPaymentWindow, setShowSelectPaymentWindow] = useState(false)
	const [order, setOrder] = useState<OrderType | null>(null)
	const [shouldFetchorderStatus, setShouldFetchOrderStatus] = useState(false)

	const fetchNumberOfActivities = useCallback(async () => {
		const [kioskResponse, activitiesResponse] = await Promise.all([
			axios.get(`${API_URL}/v1/kiosks/me`, { withCredentials: true }),
			axios.get(`${API_URL}/v1/activities`, { withCredentials: true })
		])

		const kiosk = kioskResponse.data as KioskTypeNonPopulated
		const activities = activitiesResponse.data as ActivityType[]

		const kioskActivities = activities.filter(activity =>
			kiosk.activities.some(kioskActivity => kioskActivity._id === activity._id)
		)

		setNumberOfActivities(kioskActivities.length)
	}, [API_URL, setNumberOfActivities])

	const fetchKioskid = useCallback(async () => {
		const kioskResponse = await axios.get(`${API_URL}/v1/kiosks/me`, { withCredentials: true })
		const kiosk = kioskResponse.data as KioskTypeNonPopulated
		setKioskId(kiosk._id)
	}, [API_URL, setKioskId])

	const fetchProductsAndOptions = useCallback(async () => {
		const productsResponse = await axios.get(API_URL + '/v1/products', { withCredentials: true })
		const products = productsResponse.data as ProductType[]
		products.forEach((product) => {
			product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
		})
		setProducts(products)
		const optionsResponse = await axios.get(API_URL + '/v1/options', { withCredentials: true })
		const options = optionsResponse.data as OptionType[]
		setOptions(options)
	}, [API_URL, setProducts, setOptions])

	const redirectToActivitySelection = useCallback(() => {
		router.push('/orderstation')
	}, [router])

	const validateActivityAndRedirect = useCallback(() => {
		axios.get(API_URL + '/v1/activities/' + params.activity, { withCredentials: true }).catch(() => {
			redirectToActivitySelection()
		})
	}, [API_URL, params.activity, redirectToActivitySelection])

	// Fetch products and options on mount
	useEffect(() => {
		if (API_URL === undefined) return
		fetchProductsAndOptions().catch((error) => {
			addError(error)
		})
	}, [API_URL, fetchProductsAndOptions, addError])

	// Check if the room is valid
	useEffect(() => {
		if (API_URL === undefined) return
		validateActivityAndRedirect()
	}, [router, API_URL, validateActivityAndRedirect, params.activity])

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

	// Get activity name
	useEffect(() => {
		axios.get(API_URL + '/v1/activities/' + params.activity, { withCredentials: true }).then((response) => {
			const activity = response.data as ActivityType
			setActivityName(activity.name)
		}).catch((error) => {
			addError(error)
		})
	}, [API_URL, params.activity, addError, setActivityName])

	// Fetch number of activities for kiosk
	useEffect(() => {
		if (API_URL === undefined) return
		fetchNumberOfActivities().catch((error) => {
			addError(error)
		})
	}, [API_URL, fetchNumberOfActivities, addError])

	// Fetch kiosk id
	useEffect(() => {
		if (API_URL === undefined) return
		fetchKioskid().catch((error) => {
			addError(error)
		})
	}, [API_URL, fetchKioskid, addError])

	useInterval(fetchProductsAndOptions, 1000 * 60 * 60) // Fetch products and options every hour
	useInterval(validateActivityAndRedirect, 1000 * 60 * 60) // Validate room every hour

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

	useInterval(() => {
		if (shouldFetchorderStatus) {
			axios.get(API_URL + '/v1/orders/' + order?._id + '/paymentStatus', { withCredentials: true }).then((res) => {
				const paymentStatus = res.data.paymentStatus as 'pending' | 'successful' | 'failed'
				if (paymentStatus === 'successful') {
					setOrderStatus('success')
					setShouldFetchOrderStatus(false)
				} else if (paymentStatus === 'failed') {
					setOrderStatus('error')
					setShouldFetchOrderStatus(false)
				} else if (paymentStatus === 'pending') {
					setOrderStatus('awaitingPayment')
				}
			}).catch((error) => {
				addError(error)
				setOrderStatus('error')
				setShouldFetchOrderStatus(false)
			})
		}
	}, shouldFetchorderStatus ? 1000 : null)

	const submitOrder = useCallback((type: 'Cash' | 'Card'): void => {
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
			kioskId,
			activityId: params.activity,
			products: productCart,
			options: optionCart,
			skipCheckout: false
		}

		if (type === 'Cash') {
			data.skipCheckout = true
		} else if (type === 'Card') {
			data.skipCheckout = false
			setShouldFetchOrderStatus(true)
		}

		axios.post(API_URL + '/v1/orders', data, { withCredentials: true }).then((res) => {
			setOrder(res.data as OrderType)
			setShouldFetchOrderStatus(true)
		}).catch((error) => {
			addError(error)
			setOrderStatus('error')
			setShouldFetchOrderStatus(false)
		})
	}, [API_URL, cart, params.activity, setOrderStatus, setShowOrderConfirmation, addError, kioskId, setOrder, setShouldFetchOrderStatus])

	const reset = useCallback((): void => {
		if (numberOfActivities > 1) {
			router.push('/orderstation')
		}
		setCart({
			products: {},
			options: {}
		})
		setShowOrderConfirmation(false)
		setOrderStatus('loading')
	}, [setCart, setShowOrderConfirmation, setOrderStatus, router, numberOfActivities])

	return (
		<main>
			<div className="flex h-screen">
				<div className="flex-1 overflow-y-auto">
					<div className="flex flex-row justify-center p-1">
						<h1 className="text-2xl font-bold text-center text-gray-800">{'Bestil til ' + activityName}</h1>
						<button
							onClick={redirectToActivitySelection}
							className="ml-2 px-2 text-decoration-line: underline text-blue-500 rounded-md"
							type="button"
						>
							Skift Aktivitet
						</button>
					</div>
					<SelectionWindow
						products={products}
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
						onSubmit={() => { setShowSelectPaymentWindow(true) }}
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
					/>
				}
			</div>
			<div>
				{showSelectPaymentWindow &&
					<SelectPaymentWindow
						onSubmit={(type) => {
							submitOrder(type)
							setShowOrderConfirmation(true)
							setShowSelectPaymentWindow(false)
						}}
					/>
				}
			</div>
		</main>
	)
}
