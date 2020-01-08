<template>
    <b-col cols="12">
        <b-row>
            <b-col cols="12">
                <b-card header="Stock Take">
                    <b-row class="mb-1">
                        <b-col cols="12">
                            <b-input-group>
                                <b-input-group-prepend>
                                    <b-form-input
                                        v-model="bay"
                                        placeholder="Bay"
                                        autocomplete="off"
                                    />
                                </b-input-group-prepend>
                                <b-form-input
                                    ref="queryInput"
                                    @keypress.enter="formSubmit"
                                    @click="$refs.queryInput.select()"
                                    v-model="query"
                                    placeholder="EAN, SKU or Title"
                                    autocomplete="off"
                                    autofocus
                                />
                                <b-input-group-append>
                                    <b-form-input
                                        v-model.number="quantityChange"
                                        placeholder="Quantity Change"
                                        type="number"
                                        min="1"
                                    />
                                    <b-button
                                        @click="formSubmit"
                                        variant="primary"
                                        :disabled="!canSubmit"
                                        >Submit</b-button
                                    >
                                </b-input-group-append>
                            </b-input-group>
                        </b-col>
                    </b-row>
                    <b-row class="text-secondary mb-1">
                        <b-col cols="3" class="pt-2">
                            SKU: {{ product.sku }}
                        </b-col>
                        <b-col cols="9" class="pt-2">
                            Title: {{ product.title }}
                        </b-col>
                    </b-row>
                    <b-table
                        :fields="tableHeaders"
                        :items="localQueue"
                        :tbody-tr-class="rowClass"
                    >
                        <template
                            v-slot:cell(quantityChange)="{
                                item: { quantityChange }
                            }"
                        >
                            <h4 class="mb-0">
                                <b-badge
                                    :variant="
                                        quantityChange > 0
                                            ? 'success'
                                            : 'danger'
                                    "
                                >
                                    {{
                                        quantityChange > 0
                                            ? '+' + quantityChange
                                            : quantityChange
                                    }}
                                </b-badge>
                            </h4>
                        </template>

                        <template v-slot:cell(undo)="{ item }">
                            <b-button
                                @click="undo(item)"
                                class="w-100"
                                variant="danger"
                                >Undo</b-button
                            >
                        </template>
                    </b-table>
                </b-card>
            </b-col>
            <!--            <b-col cols="3">-->
            <!--                <b-card header="Quantities">-->
            <!--                    <b-table :items="quantities" :fields="quantitiesHeaders" />-->
            <!--                </b-card>-->
            <!--            </b-col>-->
        </b-row>
    </b-col>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import Vue from 'vue'

@Component
export default class Index extends Vue {
    bay: string = ''
    query: string = ''
    quantityChange: number = 1

    product = {
        sku: 'NO PRODUCT',
        title: 'NO PRODUCT'
    }
    validProduct = false
    unresolvedSearches = 0
    formWaiting = false

    quantities: [] = []

    barcodeOptions = {
        displayValue: false,
        fontSize: 5,
        width: 1,
        height: 30
    }

    tableHeaders = [
        'bay',
        {
            key: 'sku',
            label: 'SKU'
        },
        'title',
        'quantityChange',
        {
            key: 'undo',
            label: ''
        }
    ]

    quantitiesHeaders = [
        'bay',
        {
            key: 'sku',
            label: 'SKU'
        },
        'quantity'
    ]

    localQueue: StockTakeItem[] = []

    mounted() {
        this.$watch('query', (newValue) => {
            this.unresolvedSearches++
            this.$send('stockTake/productSearch', {
                query: newValue
            }).then((products) => {
                if (products[0]) {
                    this.product = products[0]
                    this.validProduct = true
                } else {
                    this.product = {
                        sku: 'NO PRODUCT',
                        title: 'NO PRODUCT'
                    }
                    this.validProduct = false
                }
                this.unresolvedSearches--
                if (this.unresolvedSearches === 0 && this.formWaiting) {
                    this.formWaiting = false
                    this.formSubmit()
                }
            })
        })

        this.$send('stockTake/getQuantities').then((quantities) => {
            this.quantities = quantities
        })

        this.$watch('bay', (newValue: string) => {
            this.bay = newValue.toUpperCase()
        })
    }

    submitChange(
        bay: string,
        sku: string,
        title: string,
        quantityChange: number
    ) {
        const item: StockTakeItem = {
            bay,
            sku,
            title,
            quantityChange,
            submitted: false
        }
        this.localQueue.unshift(item)
        this.$send('stockTake/submitChange', {
            bay,
            sku,
            quantityChange
        }).then(() => {
            item.submitted = true
            this.$send('stockTake/getQuantities').then((quantities) => {
                this.quantities = quantities
            })
        })
    }

    formSubmit() {
        if (this.unresolvedSearches > 0) {
            this.formWaiting = true
            return
        }
        if (!this.canSubmit) return
        this.submitChange(
            this.bay,
            this.product.sku,
            this.product.title,
            this.quantityChange
        )
        this.quantityChange = 1
        ;(this.$refs.queryInput as HTMLInputElement).select()
    }

    undo(item: StockTakeItem) {
        this.submitChange(item.bay, item.sku, item.title, -item.quantityChange)
    }

    rowClass({ submitted }: StockTakeItem) {
        return submitted ? 'table-success' : 'table-info'
    }

    get canSubmit() {
        return this.validProduct && this.bay !== ''
    }
}

interface StockTakeItem {
    bay: string
    sku: string
    title: string
    quantityChange: number
    submitted: boolean
}
</script>

<style scoped></style>
