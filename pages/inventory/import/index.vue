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
                    <b-row class="mb-3">
                        <b-col cols="12" class="text-center"
                            >{{ rowsParsed }} rows parsed</b-col
                        >
                    </b-row>
                    <b-row class="mb-3" v-if="rowsParsed">
                        <b-col cols="12">
                            <b-button
                                class="w-100"
                                variant="primary"
                                @click="upload"
                            >
                                Upload
                            </b-button>
                        </b-col>
                    </b-row>
                    <b-row class="mb-3" v-if="rowsParsed">
                        <b-col cols="12" class="text-center">
                            {{ rowsUploaded }} / {{ rowsParsed }} rows updated
                        </b-col>
                    </b-row>
                    <b-row class="mb-3" v-if="sentChunks">
                        <b-col cols="12" class="text-center">
                            {{ sentChunks }} Chunks sent,
                            {{ succeedChunks }} succeeded,
                            {{ failedChunks }} failed
                        </b-col>
                    </b-row>
                    <b-row v-if="errors.length > 0">
                        <b-col cols="12">
                            <b-list-group>
                                <b-list-group-item variant="danger"
                                    >Errors</b-list-group-item
                                >
                                <b-list-group-item
                                    v-for="(error, index) in errors"
                                    :key="index"
                                    variant="danger"
                                    >{{ error }}</b-list-group-item
                                >
                            </b-list-group>
                        </b-col>
                    </b-row>
                </b-card>
            </b-col>
            <b-col cols="9">
                <b-card header="Data">
                    <b-table
                        small
                        :items="dataRows"
                        :fields="tableHeaders"
                        :per-page="20"
                        :busy="parsing"
                    >
                        <template v-slot:table-busy>
                            <div class="text-center text-danger my-2">
                                <b-spinner class="align-middle" />
                                <strong>Parsing</strong>
                            </div>
                        </template>
                    </b-table>
                </b-card>
            </b-col>
        </b-row>
    </b-col>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Papa, { ParseResult } from 'papaparse'

@Component
export default class Index extends Vue {
    filePlaceholder: string = 'No file chosen'
    dataRows: any[] = []
    parsing = false

    rowsParsed = 0
    rowsUploaded = 0

    sentChunks = 0
    failedChunks = 0
    succeedChunks = 0

    tableHeaders = [
        {
            key: 'sku',
            label: 'SKU'
        },
        'title',
        {
            key: 'ean',
            label: 'EAN'
        },
        'stockLevel',
        'stockLocations'
    ]

    errors: string[] = []

    readFile(event: any) {
        this.parsing = true
        Papa.parse(event.target.files[0], {
            dynamicTyping: true,
            header: true,
            skipEmptyLines: 'greedy',
            worker: true,
            complete: (results: ParseResult<any>): void => {
                this.parsing = false
                this.rowsParsed = results.data.length
                this.dataRows = results.data.map((row: any) => {
                    return {
                        sku: row.VAR_SKU,
                        title: row.VAR_Name,
                        ean: row.VAR_Barcode,
                        stockLevel: row.VAR_Stock,
                        stockLocations: row.VAR_Bays
                    }
                })
                const path = event.target.value.split('\\')
                this.filePlaceholder = path[path.length - 1]
                event.target.value = ''
            }
        })
    }

    upload() {
        this.$send('inventory/import/clear').then(() => {
            let cursor = 0
            const chunkSize = 100
            while (cursor < this.rowsParsed) {
                this.sentChunks++
                this.$send('inventory/import/addProducts', {
                    products: this.dataRows.slice(cursor, (cursor += chunkSize))
                })
                    .then(({ affectedRows }) => {
                        this.rowsUploaded += affectedRows
                        this.succeedChunks++
                        this.$forceUpdate()
                        console.log(this.rowsUploaded)
                    })
                    .catch(({ message }) => {
                        this.errors.push(message)
                        this.failedChunks++
                    })
            }
        })
    }
}
</script>

<style scoped></style>
