import re
from datetime import date
from django import forms
from django.core.exceptions import ValidationError
from django.db.models import Sum
from reservation.models import Reservation, Contenir


class ReservationForm(forms.ModelForm):
    class Meta:
        model = Reservation
        fields = ['coder', 'datesr', 'departr', 'arriver', 'placesr', 'nombrep', 'codec', 'numv']
        widgets = {
            'datesr': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'departr': forms.TimeInput(attrs={'type': 'time', 'class': 'form-control'}),
            'arriver': forms.TimeInput(attrs={'type': 'time', 'class': 'form-control'}),
            'placesr': forms.TextInput(attrs={'placeholder': 'Ex: 1, 2 ou 3, 4', 'class': 'form-control'}),
        }

    def clean_placesr(self):
        places_str = self.cleaned_data.get('placesr', '')
        places_list = [p.strip().upper() for p in re.split(r'[,;\s]+', places_str) if p.strip()]
        return places_list

    def clean(self):
        cleaned_data = super().clean()
        datesr = cleaned_data.get('datesr')
        departr = cleaned_data.get('departr')
        arriver = cleaned_data.get('arriver')
        numv = cleaned_data.get('numv')
        nombrep = cleaned_data.get('nombrep') or 0
        places_list = cleaned_data.get('placesr') or []

        if datesr and datesr < date.today():
            self.add_error('datesr', "La date de réservation ne peut pas être une date passée.")

        if departr and arriver and arriver <= departr:
            self.add_error('arriver', "L'heure d'arrivée doit être strictement supérieure à l'heure de départ.")

        if len(places_list) > 0 and len(places_list) != nombrep:
            self.add_error(
                'placesr',
                f"Le nombre de places saisies ({len(places_list)}) ne correspond pas au nombre de personnes ({nombrep})."
            )

        SIEGES_DEVANT = {'1', '2', 'D1', 'D2', 'DEVANT1', 'DEVANT2'}

        if datesr and numv:
            query = Reservation.objects.filter(datesr=datesr, numv=numv)
            if self.instance and self.instance.pk:
                query = query.exclude(pk=self.instance.pk)

            places_deja_reservees = query.aggregate(total=Sum('nombrep'))['total'] or 0
            places_restantes = 32 - places_deja_reservees

            if (places_deja_reservees + nombrep) > 32:
                raise ValidationError(
                    f"Capacité dépassée ! Il ne reste que {places_restantes} place(s) disponible(s) pour cette voiture le {datesr.strftime('%d/%m/%Y')}."
                )

            devant_occupes = []
            places_doublons = []

            for res in query:
                res_places = [p.strip().upper() for p in re.split(r'[,;\s]+', res.placesr) if p.strip()]
                for p in res_places:
                    if p in SIEGES_DEVANT:
                        devant_occupes.append(p)
                    if p in places_list:
                        places_doublons.append(p)

            if places_doublons:
                self.add_error(
                    'placesr',
                    f"La ou les place(s) suivante(s) sont DÉJÀ RÉSERVÉES pour cette date : {', '.join(set(places_doublons))}."
                )

            devant_demandes = [p for p in places_list if p in SIEGES_DEVANT]
            total_devant = len(devant_occupes) + len(devant_demandes)

            if total_devant > 2:
                self.add_error(
                    'placesr',
                    f"La banquette avant est limitée à 2 personnes maximum. Places déjà réservées devant : {len(devant_occupes)}/2."
                )

        cleaned_data['placesr'] = ", ".join(places_list)
        return cleaned_data


class ContenirForm(forms.ModelForm):
    class Meta:
        model = Contenir
        fields = ['coder', 'destinations', 'montants']
        widgets = {
            'montants': forms.NumberInput(attrs={'id': 'id_montants', 'step': '0.01', 'class': 'form-control'}),
        }