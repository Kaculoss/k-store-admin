import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"

import prismadb from "@/lib/prismadb"

export async function GET(
  _req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    if (!params.productId)
      return new NextResponse("Product id is required", { status: 400 })

    const product = await prismadb.product.findUnique({
      where: { id: params.productId },
      include: { images: true, category: true, size: true, color: true },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.log("[PRODUCT_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
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

    await prismadb.product.update({
      where: { id: params.productId },
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
          deleteMany: {},
        },
      },
    })

    const product = await prismadb.product.update({
      where: { id: params.productId },
      data: {
        images: {
          createMany: {
            data: images.map((image) => image),
          },
        },
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.log("[PRODUCT_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  try {
    const { userId } = auth()

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 })

    if (!params.productId)
      return new NextResponse("Product id is required", { status: 400 })

    const storeByUserId = await prismadb.store.findFirst({
      where: { id: params.storeId, userId },
    })

    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 })

    const product = await prismadb.product.deleteMany({
      where: { id: params.productId },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.log("[PRODUCT_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
