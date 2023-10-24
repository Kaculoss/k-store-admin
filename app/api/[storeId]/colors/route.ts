import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs"

import prismadb from "@/lib/prismadb"

interface IProps {
  params: { storeId: string }
}

export async function POST(req: Request, { params }: IProps) {
  try {
    const { userId } = auth()
    const { name, value }: { name: string; value: string } = await req.json()

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 })
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    if (!value) {
      return new NextResponse("Value is required", { status: 400 })
    }

    if (!params.storeId)
      return new NextResponse("Store ID is required", { status: 400 })

    const storeByUserId = await prismadb.store.findFirst({
      where: { id: params.storeId, userId },
    })

    if (!storeByUserId) return new NextResponse("Unauthorized", { status: 403 })

    const color = await prismadb.color.create({
      data: { name, value, storeId: params.storeId },
    })

    return NextResponse.json(color)
  } catch (error) {
    console.log("[COLOR_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(req: Request, { params }: IProps) {
  try {
    if (!params.storeId)
      return new NextResponse("Store ID is required", { status: 400 })

    const colors = await prismadb.color.findMany({
      where: { storeId: params.storeId },
    })

    return NextResponse.json(colors)
  } catch (error) {
    console.log("[COLOR_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
