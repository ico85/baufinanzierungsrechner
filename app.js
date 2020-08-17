(function () {

    const vuetifyOptions = {}

    new Vue({
        el: '#app',
        vuetify: new Vuetify(vuetifyOptions),
        data() {
            return {
                kaufpreis: 200000,
                eigenkapital_prozent: 0.1,
                notarkosten_prozent: 0.015,
                grunderwerbsteuer_prozent: 0.05,
                maklerprovision_prozent: 0.0357,
                modernisierungskosten: 0,
                zinssatz: 2,
                tilgungssatz: 2,
                sollzinsbindung: 30,
                laufzeit_monate: 360,
                monatliche_rate: 500,
                tilgung_type: 'laufzeit_monate',
                gezahlte_zinsen: 0,
                getilgt: 0,
                tilgungsplan: []
            }
        },
        computed: {

            gezahlt_gesamt() {
                return this.getilgt + this.gezahlte_zinsen;
            },
            laufzeit_label() {
                var monate = this.laufzeit_monate % 12;
                var jahre = Math.floor(this.laufzeit_monate / 12);

                if (monate === 0) {
                    return jahre + " Jahre";
                }

                return jahre + " Jahre und " + monate + (monate === 1 ? " Monat" : " Monate");
            },
            tilgung_label() {
                if (this.tilgung_type == 'monatliche_rate') {
                    return "Tilgung mit monatlicher Rate: " + this.monatliche_rate.toFixed(2) + " €";
                }

                if (this.tilgung_type == 'tilgungssatz') {
                    return "Tilgung mit Tilgungssatz: " + this.tilgungssatz.toFixed(2) + "%";
                }

                if (this.tilgung_type == 'laufzeit_monate') {
                    return "Tilgung mit Laufzeit: " + this.laufzeit_monate + " Monate (" + this.laufzeit_jahre.toFixed(2) + " Jahre)";
                }
            },
            calculated_monatliche_rate: {
                get() {
                    if (this.tilgung_type == 'tilgungssatz') {
                        return this.darlehenssumme * (this.zinssatz / 100 + this.tilgungssatz / 100) / 12;
                    }

                    if (this.tilgung_type == 'laufzeit_monate') {
                        var q = 1 + (this.zinssatz / 100);
                        var q_n = Math.pow(q, this.laufzeit_jahre);
                        var jaehrliche_rate = (this.darlehenssumme * q_n * (this.zinssatz / 100) / (q_n - 1));
                        var monatliche_rate = jaehrliche_rate / 12;
                        return monatliche_rate;
                    }

                    if (this.tilgung_type == 'monatliche_rate') {
                        return this.monatliche_rate;
                    }
                },
                set(monatliche_rate) {
                    var jaehrliche_rate = monatliche_rate * 12;
                    this.tilgungssatz = (jaehrliche_rate / this.darlehenssumme - this.zinssatz / 100) * 100;
                }

            },
            laufzeit_jahre() {
                return this.laufzeit_monate / 12;
            },
            darlehenssumme: {
                get() {
                    return this.kaufpreis + this.kaufnebenkosten - this.eigenkapital;
                },
                set() {
                }
            },
            eigenkapital: {
                get() {
                    return this.kaufpreis * this.eigenkapital_prozent;
                },
                set(newValue) {
                    this.eigenkapital_prozent = (newValue / this.kaufpreis);
                }
            },
            kaufnebenkosten: {
                get() {
                    return this.notarkosten + this.grunderwerbsteuer + this.maklerprovision + this.modernisierungskosten;
                },
                set(newValue) {
                    this.notarkosten_prozent = (newValue / this.kaufpreis);
                }
            },
            notarkosten: {
                get() {
                    return this.kaufpreis * this.notarkosten_prozent;
                },
                set(newValue) {
                    this.notarkosten_prozent = (newValue / this.kaufpreis);
                }

            },
            grunderwerbsteuer: {
                get() {
                    return this.kaufpreis * this.grunderwerbsteuer_prozent;
                },
                set(newValue) {
                    this.grunderwerbsteuer_prozent = (newValue / this.kaufpreis);
                }

            },
            maklerprovision: {
                get() {
                    return this.kaufpreis * this.maklerprovision_prozent;
                },
                set(newValue) {
                    this.maklerprovision_prozent = (newValue / this.kaufpreis);
                }

            },
            grunderwerbsteuer_hint() {
                return Math.round(this.grunderwerbsteuer_prozent * 10000) / 100 + "% des Kaufpreises";
            },
            notarkosten_hint() {
                return Math.round(this.notarkosten_prozent * 10000) / 100 + "% des Kaufpreises";
            },
            maklerprovision_hint() {
                return Math.round(this.maklerprovision_prozent * 10000) / 100 + "% des Kaufpreises";
            },
            eigenkapital_hint() {
                return Math.round(this.eigenkapital_prozent * 10000) / 100 + "% des Kaufpreises";
            },
        },
        methods: {
            setTilgungType(type) {
                this.tilgung_type = type;
            },
            calculate_tilgungsplan() {

                var tilgungsplan = [];

                var restschuld = this.darlehenssumme;
                var laufzeit_monate = 0;

                var zinsen, tilgung;
                var jaehrliche_rate = this.monatliche_rate * 12;
                var gezahlte_zinsen = 0;
                var getilgt = 0;

                while (restschuld > 0) {
                    zinsen = restschuld * (this.zinssatz / 12) / 100;
                    gezahlte_zinsen += zinsen;
                    tilgung = jaehrliche_rate / 12 - zinsen;
                    restschuld = restschuld - tilgung;

                    if (restschuld < 0) {
                        tilgung = tilgung - Math.abs(restschuld);
                        jaehrliche_rate = tilgung + zinsen;
                        restschuld = 0;
                    }

                    getilgt += tilgung;
                    laufzeit_monate++;

                    tilgungsplan.push({
                        zinsen: zinsen.toFixed(2),
                        tilgung: tilgung.toFixed(2),
                        rate: jaehrliche_rate / 12,
                        restschuld: restschuld.toFixed(2),
                        periode: laufzeit_monate
                    });
                }

                this.gezahlte_zinsen = gezahlte_zinsen;
                this.getilgt = getilgt;
                if (this.tilgung_type !== 'laufzeit_monate') {
                    this.laufzeit_monate = laufzeit_monate;
                }

                this.tilgungsplan = tilgungsplan;
            },
        },
        watch: {
            calculated_monatliche_rate(monatliche_rate) {
                if (monatliche_rate)
                    this.monatliche_rate = monatliche_rate;
            },
            monatliche_rate(monatliche_rate) {
                if (monatliche_rate) {
                    var jaehrliche_rate = monatliche_rate * 12;
                    this.tilgungssatz = (jaehrliche_rate / this.darlehenssumme - this.zinssatz / 100) * 100;

                    this.calculate_tilgungsplan();

                }
            },
            zinssatz() {
                this.calculate_tilgungsplan();
            },
            eigenkapital() {
                this.calculate_tilgungsplan()
            },
            kaufpreis() {
                this.calculate_tilgungsplan();
            },

            notarkosten_prozent() {
                this.calculate_tilgungsplan();
            },
            grunderwerbsteuer_prozent() {
                    this.calculate_tilgungsplan();
            },
            maklerprovision_prozent() {
                this.calculate_tilgungsplan();
            },
            modernisierungskosten() {
                this.calculate_tilgungsplan();
            }

        },

    })
})();

