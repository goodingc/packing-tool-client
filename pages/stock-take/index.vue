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
                                        :disabled="awaitingConfirmation"
                                        :formatter="toUpper"
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
                                    :disabled="awaitingConfirmation"
                                />
                                <b-input-group-append>
                                    <b-form-input
                                        v-model.number="quantityChange"
                                        placeholder="Quantity Change"
                                        type="number"
                                        min="1"
                                        :disabled="awaitingConfirmation"
                                    />
                                    <b-button
                                        @click="formSubmit"
                                        variant="primary"
                                        :disabled="
                                            !canSubmit || awaitingConfirmation
                                        "
                                        >Submit</b-button
                                    >
                                </b-input-group-append>
                            </b-input-group>
                        </b-col>
                    </b-row>
                    <b-row class="text-secondary mb-1">
                        <b-col cols="3"> SKU: {{ product.sku }} </b-col>
                        <b-col cols="9"> Title: {{ product.title }} </b-col>
                    </b-row>
                    <b-table
                        :fields="tableHeaders"
                        :items="localQueue"
                        :tbody-tr-class="rowClass"
                        small
                    >
                        <template v-slot:cell(bay)="{ item }">
                            <template v-if="editingId !== item.id">
                                {{ item.bay }}
                            </template>
                            <b-form-input
                                v-else
                                type="text"
                                v-model="item.bay"
                                :formatter="toUpper"
                            />
                        </template>
                        <template
                            v-slot:cell(quantityChange)="{
                                item
                            }"
                        >
                            <h4 class="mb-0" v-if="editingId !== item.id">
                                <b-badge
                                    :variant="
                                        item.quantityChange > 0
                                            ? 'success'
                                            : 'danger'
                                    "
                                >
                                    {{
                                        item.quantityChange > 0
                                            ? '+' + item.quantityChange
                                            : item.quantityChange
                                    }}
                                </b-badge>
                            </h4>
                            <b-form-input
                                v-else
                                type="number"
                                v-model="item.quantityChange"
                            />
                        </template>

                        <template v-slot:cell(edit)="{ item }">
                            <b-button-group
                                v-if="editingId !== item.id"
                                class="w-100"
                                size="sm"
                            >
                                <b-button
                                    variant="secondary"
                                    @click="editingId = item.id"
                                >
                                    Edit
                                </b-button>
                                <b-button @click="undo(item)" variant="danger">
                                    Undo
                                </b-button>
                            </b-button-group>
                            <b-button
                                v-else
                                variant="primary"
                                @click="saveEdit"
                                class="w-100"
                                size="sm"
                                >Save</b-button
                            >
                        </template>
                    </b-table>
                </b-card>
            </b-col>
        </b-row>
    </b-col>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import Vue from 'vue'

@Component
export default class Index extends Vue {
    bay: string = 'TEST'
    query: string = 'AM-A1500'
    quantityChange: number = 1

    product = {
        sku: 'NO PRODUCT',
        title: 'NO PRODUCT'
    }
    validProduct = false
    unresolvedSearches = 0
    formWaiting = false

    awaitingConfirmation = false

    tableHeaders = [
        'bay',
        {
            key: 'sku',
            label: 'SKU'
        },
        'title',
        'quantityChange',
        'edit'
    ]

    localQueue: StockTakeItem[] = []

    editingId = 0

    mounted() {
        this.$send('stockTake/getRecentChanges').then((items) => {
            this.localQueue = items.map((item: StockTakeItem) => {
                item.submitted = true
                return item
            })
        })

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
        this.awaitingConfirmation = true
        this.$send('stockTake/submitChange', {
            bay,
            sku,
            quantityChange
        }).then(({ insertId }) => {
            this.awaitingConfirmation = false
            item.submitted = true
            item.id = insertId
            ;(this.$refs.queryInput as HTMLInputElement).setSelectionRange(
                0,
                9999
            )
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
    }

    undo(item: StockTakeItem) {
        this.submitChange(item.bay, item.sku, item.title, -item.quantityChange)
    }

    saveEdit() {
        const editingItem = this.localQueue.find(
            ({ id }) => id === this.editingId
        )
        if (!editingItem) return
        editingItem.submitted = false
        this.$send('stockTake/editChange', editingItem).then(() => {
            this.editingId = 0
            editingItem.submitted = true
        })
    }

    rowClass({ submitted }: StockTakeItem) {
        return submitted ? 'table-success' : 'table-info'
    }

    toUpper(value: string) {
        return value.toUpperCase()
    }

    get canSubmit() {
        return this.validProduct && this.bay !== ''
    }
}

interface StockTakeItem {
    id?: number
    bay: string
    sku: string
    title: string
    quantityChange: number
    submitted?: boolean
}
</script>

<style scoped></style>
