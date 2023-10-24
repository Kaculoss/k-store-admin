import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"

import prismadb from "@/lib/prismadb"

interface IProps {
  params: { storeId: string }
}

export async function POST(req: Request, { params }: IProps) {
  try {
    const { userId } = auth()
    const { name, billboardId }: { name: string; billboardId: string } =
      await req.json()

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 })
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    if (!billboardId) {
      return new NextResponse("Billboard ID is required", { status: 400 })
    }

    if (!params.storeId)
      return new NextResponse("Store ID is required", { status: 400 })

    const storeByUserId = await prismadb.store.findFirst({
      where: { id: params.storeId, userId },
    })

    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 })

    const category = await prismadb.category.create({
      data: { name, billboardId, storeId: params.storeId },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.log("[CATEGORY_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(req: Request, { params }: IProps) {
  try {
    if (!params.storeId)
      return new NextResponse("Store ID is required", { status: 400 })

    const categories = await prismadb.category.findMany({
      where: { storeId: params.storeId },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.log("[CATEGORY_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
