-- AddForeignKey
ALTER TABLE "qrcodes_usados" ADD CONSTRAINT "qrcodes_usados_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
