<template>
    <b-col>
        <b-row>
            <b-col cols="3">
                <b-card header="File" class="mb-3">
                    <b-form-file
                        accept="test/csv"
                        placeholder="No file chosen"
                        @change="readFile"
                    />
                </b-card>
                <b-card v-if="order !== undefined" header="Data" class="mb-3">
                    <b-row class="mb-1 font-weight-bold">
                        <b-col> Order ID:</b-col>
                    </b-row>
                    <b-row class="mb-1">
                        <b-col>{{ order.id }}</b-col>
                    </b-row>
                    <b-row class="mb-1 font-weight-bold">
                        <b-col> Name:</b-col>
                    </b-row>
                    <b-row class="mb-1">
                        <b-col>{{ order.name }}</b-col>
                    </b-row>
                    <b-row class="mb-1 font-weight-bold">
                        <b-col> Ship to:</b-col>
                    </b-row>
                    <b-row class="mb-1">
                        <b-col>{{ order.shipTo }}</b-col>
                    </b-row>
                    <b-row class="mb-1 font-weight-bold">
                        <b-col> Total SKUs:</b-col>
                    </b-row>
                    <b-row class="mb-1">
                        <b-col>{{ order.totalSkus }}</b-col>
                    </b-row>
                    <b-row class="mb-1 font-weight-bold">
                        <b-col> Total Units:</b-col>
                    </b-row>
                    <b-row class="mb-3">
                        <b-col>{{ order.totalUnits }}</b-col>
                    </b-row>
                    <b-row class="mb-1 font-weight-bold">
                        <b-col> Assigned FC:</b-col>
                    </b-row>
                    <b-row>
                        <b-col>
                            <b-select
                                v-model="fulfillmentCenterId"
                                :options="fulfillmentCenterIds"
                                class="mb-2"
                            ></b-select>
                        </b-col>
                    </b-row>
                </b-card>
                <b-card
                    v-if="order !== undefined && fulfillmentCenterId !== undefined"
                    header="Upload"
                >
                    <b-button
                        id="upload-button"
                        class="w-100"
                        variant="primary"
                        @click="upload"
                    >Upload
                    </b-button>
                    <b-tooltip
                        :show.sync="showTooltip"
                        :variant="error === undefined ? 'success' : 'danger'"
                        target="upload-button"
                        triggers=""
                    >
                        {{ error === undefined ? 'Successfully uploaded' : error }}
                    </b-tooltip>
                </b-card>
            </b-col>
            <b-col cols="9">
                <b-table
                    v-if="order !== undefined && order.items !== undefined"
                    :items="order.items"
                ></b-table>
            </b-col>
        </b-row>
    </b-col>
</template>

<script lang="ts">
import Vue from 'vue'
import { readAsText } from 'promise-file-reader'
import Papa from 'papaparse'

export default Vue.extend({
    data() {
        return {
            order: undefined as Order | undefined,
            showTooltip: false,
            error: undefined as string | undefined,
            fulfillmentCenterIds: undefined as string[] | undefined,
            fulfillmentCenterId: undefined as string | undefined,
        }
    },
    async created() {
        this.fulfillmentCenterIds = await this.$send('importPurchaseOrders/v2/getFulfillmentCenters')
    },
    methods: {
        async readFile(e: Event) {
            const fileList = (e.target as HTMLInputElement).files
            if (fileList === null || fileList.length === 0) {
                return
            }
            const input = (await readAsText(fileList[0])) as string
            const lines = input.split('\n')
            this.order = {
                id: lines[0].split('\t')[1],
                name: lines[1].split('\t')[1],
                planId: lines[2].split('\t')[1],
                shipTo: lines[3].split('\t')[1],
                totalSkus: parseInt(lines[4].split('\t')[1]),
                totalUnits: parseInt(lines[5].split('\t')[1]),
            }

            Papa.parse(lines.slice(9).join('\n').trimRight(), {
                transform(value: string): any {
                    return value.trim()
                },
                complete: (results) => {
                    if (this.order === undefined) {
                        return
                    }

                    this.order.items = results.data.map((row: any) => {
                        return {
                            sku: row[0],
                            title: row[1],
                            asin: row[2],
                            fnSku: row[3],
                            externalId: row[4],
                            condition: row[5],
                            whoPrep: row[6],
                            prepType: row[7],
                            whoLabel: row[8],
                            orderQuantity: parseInt(row[9]),
                        }
                    })
                },
            })
        },
        async upload() {
            if(this.order === undefined) {
                return
            }
            this.error = undefined
            try {
                await this.$send('importPurchaseOrders/addPurchaseOrder', {
                    purchaseOrder: {
                        id: this.order.id,
                        fulfillmentCenterId: this.fulfillmentCenterId,
                        vendorCode: 'XXXXX',
                        deliveryWindowStart: '2021-01-01',
                        deliveryWindowEnd: '2021-01-01',
                        products: this.order.items?.map(item => ({
                            sku: item.sku,
                            orderedQuantity: item.orderQuantity,
                            acceptedQuantity: item.orderQuantity,
                            title: item.title,
                            asin: item.asin,
                            prepRequired: null,
                            weight: -1,
                            ean: item.externalId.substring(6),
                            sellPrice: -1,
                            unitCost: -1,
                            shippingCost: -1,
                            overheadCost: -1,
                            vat: -1,
                            includingVatFee: -1,
                            excludingVatFee: -1,
                            otherFee: -1,
                            profit: -1
                        }))
                    }
                })
            } catch (e) {
                this.error = e.message
            }
            this.showTooltip = true
            setTimeout(() => {
                this.showTooltip = false
            }, 3000)
        },
    },
})

type Order = {
    id: string
    name: string
    planId: string
    shipTo: string
    totalSkus: number
    totalUnits: number
    items?: OrderItem[]
    friendlyName?: string
}

type OrderItem = {
    sku: string
    title: string
    asin: string
    fnSku: string
    externalId: string
    condition: string
    whoPrep: string
    prepType: string
    whoLabel: string
    orderQuantity: number
}
</script>
