import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"

import prismadb from "@/lib/prismadb"

interface IProps {
  params: { storeId: string }
}

export async function POST(req: Request, { params }: IProps) {
  try {
    const { userId } = auth()
    const {
      name,
      images,
      price,
      sizeId,
      colorId,
      categoryId,
      isFeatured,
      isArchived,
    }: {
      name: string
      price: number
      sizeId: string
      categoryId: string
      colorId: string
      isFeatured: boolean
      isArchived: boolean
      images: {
        url: string
      }[]
    } = await req.json()

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 })

    if (!name) return new NextResponse("Name is required", { status: 400 })

    if (!images || !images.length)
      return new NextResponse("Images are required", { status: 400 })

    if (!price) return new NextResponse("Price is required", { status: 400 })

    if (!sizeId) return new NextResponse("Size Id is required", { status: 400 })

    if (!colorId)
      return new NextResponse("Color Id is required", { status: 400 })

    if (!categoryId)
      return new NextResponse("Category Id is required", { status: 400 })

    if (!params.storeId)
      return new NextResponse("Store ID is required", { status: 400 })

    const storeByUserId = await prismadb.store.findFirst({
      where: { id: params.storeId, userId },
    })

    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 })

    const product = await prismadb.product.create({
      data: {
        name,
        price,
        sizeId,
        colorId,
        categoryId,
        isFeatured,
        isArchived,
        storeId: params.storeId,
        images: {
          createMany: {
            data: images.map((image) => image),
          },
        },
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.log("[PRODUCT_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(req: Request, { params }: IProps) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get("categoryId") || undefined
    const sizeId = searchParams.get("sizeId") || undefined
    const colorId = searchParams.get("colorId") || undefined
    const isFeatured = searchParams.get("isFeatured")

    if (!params.storeId)
      return new NextResponse("Store ID is required", { status: 400 })

    const products = await prismadb.product.findMany({
      where: {
        storeId: params.storeId,
        categoryId,
        colorId,
        sizeId,
        isArchived: false,
        isFeatured: isFeatured ? true : undefined,
      },
      include: { images: true, color: true, size: true, category: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.log("[PRODUCT_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
