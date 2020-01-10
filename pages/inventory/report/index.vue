<template>
    <b-col cols="12">
        <b-row>
            <b-col cols="3">
                <b-card header="Options">
                    <b-row class="mb-3">
                        <b-col cols="12" class="text-center">
                            <h3>Delivery Windows</h3>
                        </b-col>
                    </b-row>
                    <b-row class="mb-3">
                        <b-col cols="12">
                            <b-button-group class="w-100" vertical>
                                <b-button
                                    v-for="deliveryWindow in distinctDeliveryWindows"
                                    :pressed.sync="deliveryWindow.active"
                                    :variant="
                                        deliveryWindow.active
                                            ? 'secondary'
                                            : 'outline-secondary'
                                    "
                                >
                                    {{ deliveryWindow.start.format('DD/MM') }}
                                    -
                                    {{ deliveryWindow.end.format('DD/MM') }}
                                </b-button>
                            </b-button-group>
                        </b-col>
                    </b-row>
                    <b-row>
                        <b-col cols="12">
                            <b-button
                                class="w-100"
                                variant="primary"
                                @click="print"
                            >
                                Print
                            </b-button>
                        </b-col>
                    </b-row>
                </b-card>
            </b-col>
            <b-col cols="9">
                <b-card header="Report">
                    <b-row>
                        <b-col id="reportTableWrapper" cols="12">
                            <b-table
                                :fields="reportHeaders"
                                :items="report"
                                small
                                :style="
                                    printing && `font-size: 10px; border: 2px`
                                "
                                :bordered="printing"
                            >
                                <template
                                    v-slot:cell(deliveryWindow)="{
                                        item: {
                                            purchaseOrder: { deliveryWindow }
                                        }
                                    }"
                                >
                                    {{ deliveryWindow.start.format('DD/MM') }}
                                    -
                                    {{ deliveryWindow.end.format('DD/MM') }}
                                </template>
                            </b-table>
                        </b-col>
                    </b-row>
                </b-card>
            </b-col>
        </b-row>
    </b-col>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import moment, { Moment } from '~/node_modules/moment'

@Component
export default class Index extends Vue {
    reportHeaders = [
        {
            label: 'SKU',
            key: 'sku'
        },
        {
            label: 'PO #',
            key: 'purchaseOrder.id'
        },
        {
            label: 'FC',
            key: 'purchaseOrder.fulfillmentCenterId'
        },
        'title',
        'allocatedQuantity',
        'shippedQuantity',
        'unallocatedQuantity',
        'deliveryWindow',
        'stockLevel',
        'stockLocations'
    ]
    products: any[] = []

    printing = false

    distinctDeliveryWindows: DeliveryWindow[] = []

    mounted() {
        this.$send('inventory/report/get').then((products) => {
            this.products = products.map((product: any) => {
                product.purchaseOrder.deliveryWindow.start = moment(
                    product.purchaseOrder.deliveryWindow.start
                )
                product.purchaseOrder.deliveryWindow.end = moment(
                    product.purchaseOrder.deliveryWindow.end
                )
                return product
            })

            this.distinctDeliveryWindows = this.products.reduce(
                (
                    distinctDeliveryWindows,
                    { purchaseOrder: { deliveryWindow } }
                ) => {
                    if (
                        !distinctDeliveryWindows.reduce(
                            (
                                alreadyIncluded: boolean,
                                deliveryWindow_: DeliveryWindow
                            ) =>
                                alreadyIncluded ||
                                this.equalDeliveryWindows(
                                    deliveryWindow,
                                    deliveryWindow_
                                ),
                            false
                        )
                    ) {
                        distinctDeliveryWindows.push(
                            Object.assign(
                                {
                                    active: true
                                },
                                deliveryWindow
                            )
                        )
                    }
                    return distinctDeliveryWindows
                },
                []
            )
        })
    }

    print() {
        this.printing = true
        this.$nextTick().then(() => {
            this.$print('reportTableWrapper', {
                landscape: true
            }).then(() => {
                this.printing = false
            })
        })
    }

    equalDeliveryWindows(
        { start, end }: DeliveryWindow,
        { start: start_, end: end_ }: DeliveryWindow
    ): boolean {
        return start.isSame(start_) && end.isSame(end_)
    }

    get report() {
        return this.products.filter(({ purchaseOrder: { deliveryWindow } }) => {
            return this.distinctDeliveryWindows.some((deliveryWindow_) => {
                return (
                    this.equalDeliveryWindows(
                        deliveryWindow,
                        deliveryWindow_
                    ) && deliveryWindow_.active
                )
            })
        })
    }
}

interface DeliveryWindow {
    start: Moment
    end: Moment
    active?: boolean
}
</script>

<style scoped></style>
