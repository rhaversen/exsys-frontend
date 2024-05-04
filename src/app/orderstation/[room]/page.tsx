'use client'

import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { OrderWindow, convertOrderWindowFromUTC } from '@/lib/timeUtils'
import CartWindow from '@/components/orderstation/cart/CartWindow'
import SelectionWindow from '@/components/orderstation/select/SelectionWindow'

export interface CartType {
	products: Record<string, number>
	options: Record<string, number>
}

export interface ProductType {
	_id: string
	name: string
	price: number
	orderWindow: OrderWindow
	options: string[]
	imageURL?: string
}

export interface OptionType {
	_id: string
	name: string
	price: number
	imageURL?: string
}

export default function Page({ params }: Readonly<{ params: { room: string } }>) {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [products, setProducts] = useState<ProductType[]>([])
	const [options, setOptions] = useState<OptionType[]>([])
	const [cart, setCart] = useState<CartType>({
		products: {},
		options: {},
	})
	const [formIsValid, setFormIsValid] = useState(false)

	const fetchProducts = useCallback(async () => {
		try {
			const response = await axios.get(API_URL + '/v1/products')
			response.data.forEach((product: { orderWindow: OrderWindow }) => {
				product.orderWindow = convertOrderWindowFromUTC(product.orderWindow)
			})
			setProducts(response.data)
		} catch (error) {
			console.error(error)
		}
	}, [API_URL, setProducts])

	const fetchOptions = useCallback(async () => {
		try {
			const response = await axios.get(API_URL + '/v1/options')
			setOptions(response.data)
		} catch (error) {
			console.error(error)
		}
	}, [API_URL, setOptions])

	useEffect(() => {
		if (API_URL === undefined) return
		fetchProducts()
		fetchOptions()
	}, [API_URL, fetchProducts, fetchOptions])

	useEffect(() => {
		const productSelected = Object.values(cart.products).some((quantity) => quantity > 0)
		setFormIsValid(productSelected)
	}, [cart])

	const handleCartChange = (_id: string, type: 'products' | 'options', change: number) => {
		setCart((prevCart) => {
			const newCart = { ...prevCart }
			newCart[type][_id] += change
			return newCart
		})
	}

	const submitOrder = async () => {
		try {
			const productCart = Object.entries(cart.products).map(
				([item, quantity]) => ({ id: item, quantity })
			)

			const optionCart = Object.entries(cart.options).map(
				([item, quantity]) => ({ id: item, quantity })
			)

			const data = {
				roomId: params.room,
				products: productCart,
				options: optionCart
			}

			console.log(data)

			await axios.post(API_URL + '/v1/orders', data)

		} catch (error) {
			console.error(error)
		}
	}

	return (
		<main>
			<SelectionWindow
				products={products}
				options={options}
				handleCartChange={handleCartChange}
			/>
			<CartWindow
				products={products}
				options={options}
				cart={cart}
				onCartChange={handleCartChange}
				onSubmit={submitOrder}
				formIsValid={formIsValid}
			/>
		</main>
	)
}
