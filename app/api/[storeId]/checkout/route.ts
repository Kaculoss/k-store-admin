// import https from "https";
import { NextResponse } from "next/server"
import axios from "axios"

import prismadb from "@/lib/prismadb"

interface IProps {
  params: { storeId: string }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: Request, { params }: IProps) {
  try {
    const {
      productIds,
      email,
      fullName,
      phone,
      country,
      city,
      address,
    }: {
      productIds: string[]
      email: string
      fullName: string
      country: string
      phone: string
      city: string
      address: string
    } = await req.json()

    if (!productIds || productIds.length === 0) {
      return new NextResponse("Product ids are required", { status: 400 })
    }

    if (!email)
      return new NextResponse("Customer email is required", { status: 400 })

    if (!fullName)
      return new NextResponse("Customer fullname is required", { status: 400 })

    if (!phone)
      return new NextResponse("Customer phone is required", { status: 400 })

    if (!country)
      return new NextResponse("Customer country is required", { status: 400 })

    if (!city)
      return new NextResponse("Customer city is required", { status: 400 })

    if (!address)
      return new NextResponse("Customer address is required", { status: 400 })

    const products = await prismadb.product.findMany({
      where: { id: { in: productIds } },
    })

    if (!products || products.length === 0) {
      return new NextResponse("Products not in strore", { status: 400 })
    }

    const totalPrice = products.reduce(
      (total, current) => (total += Number(current.price)),
      0
    )

    const order = await prismadb.order.create({
      data: {
        storeId: params.storeId,
        isPaid: false,
        orderItems: {
          create: productIds.map((productId) => ({
            product: { connect: { id: productId } },
          })),
        },
      },
    })

    const paystackParams = {
      email,
      amount: totalPrice * 100,
      currency: "GHS",
      callback_url: `${process.env.FRONTEND_STORE_URL}/cart?success=1`,
      metadata: {
        orderId: order.id,
        fullName,
        phone,
        country,
        address,
        city,
        cart_products: products.map((product) => ({
          name: product.name,
          price: product.price,
          id: product.id,
        })),
      },
    }

    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      paystackParams,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    )

    return NextResponse.json(paystackResponse.data, { headers: corsHeaders })
  } catch (error) {
    console.log("[CHECKOUT_POST_2]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
