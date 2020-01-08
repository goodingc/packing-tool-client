<template>
    <b-col cols="12">
        <b-row>
            <b-col cols="3">
                <b-card header="Upload Data">
                    <b-row class="mb-3">
                        <b-col cols="12">
                            <b-form-file
                                accept="test/csv"
                                @change="readFile"
                                :placeholder="filePlaceholder"
                            />
                        </b-col>
                    </b-row>
                    <b-row>
                        <b-col cols="12">
                            <b-table
                                :items="headerMappings"
                                :fields="headerTableFields"
                                sticky-header="calc(100vh - 270px)"
                            >
                                <template v-slot:cell(fileHeader)="{ item }">
                                    <b-form-select
                                        :options="fileHeaderOptions"
                                        v-model="item.fileColumnIndex"
                                    />
                                </template>
                            </b-table>
                        </b-col>
                    </b-row>
                    <b-row>
                        <b-col cols="12">
                            <b-button
                                class="w-100"
                                variant="primary"
                                :disabled="errors.rows.length !== 0"
                                @click="upload"
                                >Upload</b-button
                            >
                        </b-col>
                    </b-row>
                </b-card>
            </b-col>
            <b-col cols="9">
                <b-card header="Data">
                    <b-table
                        :fields="errorTableHeaders"
                        :items="errors.rows"
                        small
                        v-if="errors.rows.length > 0"
                    >
                        <template v-slot:head()="{ label }">
                            {{ label }}
                        </template>

                        <template
                            v-slot:cell()="{ value, index, field: { key } }"
                        >
                            <template v-if="value.error">
                                <span :id="`${index}-${key}`">{{
                                    value.value
                                }}</span>
                                <b-popover
                                    triggers="hover"
                                    :target="`${index}-${key}`"
                                >
                                    {{ value.error }}
                                </b-popover>
                            </template>
                            <template v-else>
                                {{ value }}
                            </template>
                        </template>
                    </b-table>
                    <b-list-group v-else>
                        <b-list-group-item
                            v-for="purchaseOrder in purchaseOrders"
                            :id="`${purchaseOrder.id}-item`"
                            :key="purchaseOrder.id"
                            :variant="
                                purchaseOrder.meta.uploaded
                                    ? purchaseOrder.meta.uploadError
                                        ? 'danger'
                                        : 'success'
                                    : ''
                            "
                        >
                            <b-popover
                                v-if="purchaseOrder.meta.uploadError"
                                :target="`${purchaseOrder.id}-item`"
                                triggers="hover focus"
                                variant="danger"
                            >
                                <template v-slot:title>Upload Error</template>
                                {{ purchaseOrder.meta.uploadError }}
                            </b-popover>
                            <b-row>
                                <b-col cols="4">
                                    PO #: {{ purchaseOrder.id }}
                                </b-col>
                                <b-col cols="4">
                                    FC: {{ purchaseOrder.fulfillmentCenterId }}
                                </b-col>
                                <b-col cols="4">
                                    Vendor: {{ purchaseOrder.vendorCode }}
                                </b-col>
                            </b-row>
                            <b-row class="mb-1">
                                <b-col cols="4">
                                    Deliver from:
                                    {{
                                        formatDate(
                                            purchaseOrder.deliveryWindowStart
                                        )
                                    }}
                                </b-col>
                                <b-col cols="4">
                                    Deliver until:
                                    {{
                                        formatDate(
                                            purchaseOrder.deliveryWindowEnd
                                        )
                                    }}
                                </b-col>
                            </b-row>
                            <b-row>
                                <b-col cols="12">
                                    <b-list-group
                                        v-if="purchaseOrder.meta.collapsed"
                                    >
                                        <b-list-group-item
                                            variant="primary"
                                            @click="
                                                purchaseOrder.meta.collapsed = false
                                            "
                                        >
                                            Click to expand products
                                        </b-list-group-item>
                                    </b-list-group>
                                    <b-list-group v-else>
                                        <b-list-group-item
                                            v-for="product in purchaseOrder.products"
                                            :key="
                                                `${purchaseOrder.id}-${product.sku}`
                                            "
                                        >
                                            <b-row>
                                                <b-col cols="6">
                                                    Title:
                                                    {{ product.title }}
                                                </b-col>
                                                <b-col cols="2">
                                                    SKU:
                                                    {{ product.sku }}
                                                </b-col>
                                                <b-col cols="2">
                                                    EAN:
                                                    {{ product.ean }}
                                                </b-col>
                                                <b-col cols="2">
                                                    ASIN:
                                                    {{ product.asin }}
                                                </b-col>
                                            </b-row>
                                            <b-row>
                                                <b-col cols="2">
                                                    Accepted:
                                                    {{
                                                        product.acceptedQuantity
                                                    }}
                                                    /
                                                    {{
                                                        product.orderedQuantity
                                                    }}
                                                </b-col>
                                                <b-col cols="2">
                                                    Weight:
                                                    {{ product.weight }}
                                                    kg
                                                </b-col>
                                                <b-col cols="2"
                                                    >Prep Required:
                                                    {{
                                                        product.prepRequired ||
                                                            'None'
                                                    }}
                                                </b-col>
                                                <b-col cols="2"
                                                    >VAT:
                                                    {{ product.vat * 100 }}%
                                                </b-col>
                                            </b-row>
                                            <b-row>
                                                <b-col cols="12">
                                                    Profit: £{{
                                                        product.sellPrice
                                                    }}
                                                    - £{{ product.unitCost }} -
                                                    £{{
                                                        product.shippingCost
                                                    }}
                                                    - £{{
                                                        product.overheadCost
                                                    }}
                                                    - £{{
                                                        product.includingVatFee
                                                    }}
                                                    - £{{
                                                        product.excludingVatFee
                                                    }}
                                                    - £{{ product.otherFee }} =
                                                    £{{ product.profit }}
                                                </b-col>
                                            </b-row>
                                        </b-list-group-item>
                                        <b-list-group-item
                                            variant="danger"
                                            @click="
                                                purchaseOrder.meta.collapsed = true
                                            "
                                        >
                                            Click to collapse products
                                        </b-list-group-item>
                                    </b-list-group>
                                </b-col>
                            </b-row>
                        </b-list-group-item>
                    </b-list-group>
                </b-card>
            </b-col>
        </b-row>
    </b-col>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Papa, { ParseResult } from 'papaparse'
import { parse, format, ValidDate } from 'ts-date'
import { ean13 } from 'ean-check'

@Component
export default class Index extends Vue {
    filePlaceholder: string = 'No file chosen'

    fileHeaders: string[] = []
    fileRows: any[] = []

    headerMappings: HeaderMapping[] = [
        {
            header: 'purchaseOrderId',
            fileColumnIndex: 0,
            readableHeader: 'PO #'
        },
        {
            header: 'fulfillmentCenterId',
            fileColumnIndex: 1,
            readableHeader: 'Fulfillment Center'
        },
        {
            header: 'vendorCode',
            fileColumnIndex: 2,
            readableHeader: 'Vendor Code'
        },
        {
            header: 'asin',
            fileColumnIndex: 3,
            readableHeader: 'ASIN'
        },
        {
            header: 'sku',
            fileColumnIndex: 4,
            readableHeader: 'SKU'
        },
        {
            header: 'ean',
            fileColumnIndex: 5,
            readableHeader: 'EAN'
        },
        {
            header: 'title',
            fileColumnIndex: 6,
            readableHeader: 'Title'
        },
        {
            header: 'acceptedQuantity',
            fileColumnIndex: 7,
            readableHeader: 'Accepted Quantity'
        },
        {
            header: 'orderedQuantity',
            fileColumnIndex: 8,
            readableHeader: 'Ordered Quantity'
        },
        {
            header: 'sellPrice',
            fileColumnIndex: 9,
            readableHeader: 'Sell Price'
        },
        {
            header: 'unitCost',
            fileColumnIndex: 10,
            readableHeader: 'Unit Cost'
        },
        {
            header: 'shippingCost',
            fileColumnIndex: 11,
            readableHeader: 'Shipping Cost'
        },
        {
            header: 'overheadCost',
            fileColumnIndex: 12,
            readableHeader: 'Overhead Cost'
        },
        {
            header: 'vat',
            fileColumnIndex: 13,
            readableHeader: 'VAT'
        },
        {
            header: 'prepRequired',
            fileColumnIndex: 14,
            readableHeader: 'Prep Required'
        },
        {
            header: 'includingVatFee',
            fileColumnIndex: 15,
            readableHeader: 'Including VAT Fee'
        },
        {
            header: 'excludingVatFee',
            fileColumnIndex: 16,
            readableHeader: 'Excluding VAT Fee'
        },
        {
            header: 'otherFee',
            fileColumnIndex: 17,
            readableHeader: 'Other Fee'
        },
        {
            header: 'profit',
            fileColumnIndex: 18,
            readableHeader: 'Profit'
        },
        {
            header: 'weight',
            fileColumnIndex: 19,
            readableHeader: 'Weight'
        },
        {
            header: 'deliveryWindowStart',
            fileColumnIndex: 20,
            readableHeader: 'Delivery Window Start'
        },
        {
            header: 'deliveryWindowEnd',
            fileColumnIndex: 21,
            readableHeader: 'Delivery Window End'
        }
    ]

    headerTableFields = ['readableHeader', 'fileHeader']

    fulfillmentCenters = []

    purchaseOrders: any[] = []

    errors: {
        headers: string[]
        rows: any[]
    } = {
        headers: [],
        rows: []
    }

    errorTableHeaders: any[] = []

    mounted() {
        this.$send('models/selectAll', {
            model: 'fulfillmentCenters'
        }).then((fulfillmentCenters) => {
            this.fulfillmentCenters = fulfillmentCenters
        })

        this.$watch(
            'headerMappings',
            () => {
                this.calculate()
            },
            {
                deep: true
            }
        )
    }

    formatDate(date: ValidDate) {
        return format(date, 'DD/MM/YYYY')
    }

    readFile(event: any) {
        Papa.parse(event.target.files[0], {
            dynamicTyping: true,
            header: true,
            skipEmptyLines: true,
            complete: (results: ParseResult): void => {
                this.fileHeaders = results.meta.fields
                this.fileRows = results.data
                const path = event.target.value.split('\\')
                this.filePlaceholder = path[path.length - 1]
                event.target.value = ''
                this.calculate()
            }
        })
    }

    calculate() {
        const dataRows = this.fileRows.map((fileRow) => {
            const dataRow: any = {}
            this.headerMappings.forEach((headerMapping) => {
                let value =
                    fileRow[this.fileHeaders[headerMapping.fileColumnIndex]]
                if (headerMapping.header === 'ean' && value) {
                    value = value.toString()
                    if (value.length === 12) {
                        value = '0' + value
                    }
                }
                if (typeof value === 'string') {
                    value = value.trim()
                }
                dataRow[headerMapping.header] = value
            })
            return dataRow
        })

        this.errors.rows = []
        this.errors.headers = ['purchaseOrderId', 'sku']

        dataRows.forEach((dataRow) => {
            let failsAssertion = false
            const _cellVariants: any = {}
            const assert = (
                attribute: string,
                test: (value: any) => boolean,
                error: string
            ) => {
                const value = dataRow[attribute]
                const failAssertion = (error: string) => {
                    dataRow[attribute] = {
                        value,
                        error
                    }
                    _cellVariants[attribute] = 'danger'
                    if (!this.errors.headers.includes(attribute)) {
                        this.errors.headers.push(attribute)
                    }
                    failsAssertion = true
                }
                const requiredHeaders = [
                    'purchaseOrderId',
                    'sku',
                    'orderedQuantity',
                    'acceptedQuantity',
                    'title',
                    'fulfillmentCenterId',
                    'deliveryWindowStart',
                    'deliveryWindowEnd'
                ]
                if (
                    requiredHeaders.includes(attribute) &&
                    !value &&
                    value !== 0
                ) {
                    failAssertion(`${attribute} not present`)
                    return
                }
                if (!test(value)) {
                    failAssertion(error)
                }
            }

            assert(
                'sku',
                (sku) => /[A-Z]{2}-([A-Z]|[0-9])+/g.test(sku),
                'SKU does not match pattern: two capital letters, a dash, then all capitals or numbers'
            )

            assert(
                'purchaseOrderId',
                (poId) => poId.length === 8,
                'PO # should be 8 characters long'
            )

            assert(
                'ean',
                (ean) => {
                    if (!ean) {
                        return true
                    }
                    return ean13.check(ean)
                },
                'Invalid EAN, no EAN is allowed'
            )

            assert(
                'fulfillmentCenterId',
                (fcId) =>
                    !!this.fulfillmentCenters.find(({ id }) => id === fcId),
                'Invalid fulfillment center'
            )

            assert(
                'asin',
                (asin) => {
                    if (!asin) {
                        return true
                    }
                    return asin.length === 10
                },
                'ASIN should be 10 digits long or empty'
            )

            assert(
                'deliveryWindowStart',
                (dws) => typeof dws === 'string' && !!parse(dws, 'DD/MM/YYYY'),
                'Invalid date'
            )

            assert(
                'deliveryWindowEnd',
                (dwe) => typeof dwe === 'string' && !!parse(dwe, 'DD/MM/YYYY'),
                'Invalid date'
            )

            assert(
                'orderedQuantity',
                (oq) => typeof oq === 'number',
                'Ordered quantity should be number'
            )

            assert(
                'acceptedQuantity',
                (aq) => typeof aq === 'number',
                'Accepted quantity should be number'
            )

            if (failsAssertion) {
                dataRow._cellVariants = _cellVariants
                this.errors.rows.push(dataRow)
            }
        })

        this.errorTableHeaders = this.errors.headers.map((errorHeader) => {
            const headerMapping = this.headerMappings.find(
                ({ header }) => header === errorHeader
            )
            if (headerMapping) {
                return {
                    key: headerMapping.header,
                    label: headerMapping.readableHeader
                }
            }
        })

        if (this.errors.rows.length > 0) {
            return []
        }
        this.purchaseOrders = []
        if (this.errors.rows.length === 0) {
            dataRows.forEach((dataRow) => {
                let purchaseOrder = this.purchaseOrders.find(
                    ({ id }) => id === dataRow.purchaseOrderId
                )
                if (!purchaseOrder) {
                    purchaseOrder = {
                        id: dataRow.purchaseOrderId,
                        fulfillmentCenterId: dataRow.fulfillmentCenterId,
                        vendorCode: dataRow.vendorCode,
                        deliveryWindowStart: parse(
                            dataRow.deliveryWindowStart,
                            'DD/MM/YYYY'
                        ),
                        deliveryWindowEnd: parse(
                            dataRow.deliveryWindowEnd,
                            'DD/MM/YYYY'
                        ),
                        products: [],
                        meta: {
                            collapsed: true,
                            uploaded: false
                        }
                    }
                    this.purchaseOrders.push(purchaseOrder)
                }
                purchaseOrder.products.push({
                    sku: dataRow.sku,
                    title: dataRow.title,
                    asin: dataRow.asin,
                    ean: dataRow.ean,
                    orderedQuantity: dataRow.orderedQuantity,
                    acceptedQuantity: dataRow.acceptedQuantity,
                    sellPrice: dataRow.sellPrice,
                    unitCost: dataRow.unitCost,
                    shippingCost: dataRow.shippingCost,
                    overheadCost: dataRow.overheadCost,
                    prepRequired: dataRow.prepRequired,
                    vat: dataRow.vat,
                    includingVatFee: dataRow.includingVatFee,
                    excludingVatFee: dataRow.excludingVatFee,
                    otherFee: dataRow.otherFee,
                    profit: dataRow.profit,
                    weight: dataRow.weight
                })
            })
        }
    }

    upload() {
        for (const purchaseOrder of this.purchaseOrders) {
            const purchaseOrderClean = Object.assign({}, purchaseOrder)
            delete purchaseOrderClean.meta
            purchaseOrderClean.deliveryWindowStart = format(
                purchaseOrderClean.deliveryWindowStart,
                'YYYY-MM-DD'
            )
            purchaseOrderClean.deliveryWindowEnd = format(
                purchaseOrderClean.deliveryWindowEnd,
                'YYYY-MM-DD'
            )
            this.$send('uploadData/addPurchaseOrder', purchaseOrderClean)
                .catch((error) => {
                    purchaseOrder.meta.uploadError = error.message
                })
                .finally(() => {
                    purchaseOrder.meta.uploaded = true
                })
        }
    }

    get fileHeaderOptions() {
        return this.fileHeaders.map((fileHeader, index) => {
            return {
                value: index,
                text: fileHeader
            }
        })
    }
}

interface HeaderMapping {
    header: string
    fileColumnIndex: number
    readableHeader: string
}
</script>

<style scoped></style>
