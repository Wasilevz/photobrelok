import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId || orderId.trim().length === 0) {
    return NextResponse.json({ error: "Номер заказа обязателен" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("orders")
    .select("status, customer_name, created_at, photo_urls")
    .eq("order_id", orderId.trim().toUpperCase())
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  return NextResponse.json(data);
}
