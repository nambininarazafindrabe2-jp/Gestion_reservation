from rest_framework import serializers
from django.utils import timezone
from .models import Client, Voiture, Trajet, Reservation, Contenir


class ContactField(serializers.RegexField):
    def to_internal_value(self, data):
        if not isinstance(data, str):
            self.fail('invalid')
        return super().to_internal_value(data)


class ClientSerializer(serializers.ModelSerializer):
    contact = ContactField(
        regex=r'^[0-9]{10}$',
        min_length=10,
        max_length=10,
        trim_whitespace=False,
        error_messages={
            'invalid': "Le contact doit contenir exactement 10 chiffres (0 à 9).",
            'min_length': "Le contact doit contenir exactement 10 chiffres (0 à 9).",
            'max_length': "Le contact doit contenir exactement 10 chiffres (0 à 9).",
        },
    )

    class Meta:
        model = Client
        fields = '__all__'


class VoitureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voiture
        fields = '__all__'
    def validate_capaciteV(self, value):
        if value is None:
            raise serializers.ValidationError("La capacité est obligatoire.")
        if value < 18 or value > 32:
            raise serializers.ValidationError(
                "La capacité de la voiture doit être comprise entre 18 et 32 places."
            )
        return value
       

class TrajetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trajet
        fields = '__all__'


class ReservationSerializer(serializers.ModelSerializer):
    codec = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        required=True,
        allow_null=False,
        error_messages={'null': 'Veuillez sélectionner un client valide.'}
    )
    numv = serializers.PrimaryKeyRelatedField(
        queryset=Voiture.objects.all(),
        required=True,
        allow_null=False,
        error_messages={'null': 'Veuillez sélectionner une voiture valide.'}
    )

    class Meta:
        model = Reservation
        fields = ['coder', 'datesr', 'departr', 'arriver', 'placesr', 'nombrep', 'codec', 'numv']

    def validate(self, data):
        datesr = data.get('datesr')
        today = timezone.localdate()
        if datesr and datesr < today:
            raise serializers.ValidationError({
                'datesr': f"La date de réservation ne peut pas être dans le passé (Date minimale: {today})."
            })

        departr = data.get('departr')
        arriver = data.get('arriver')
        if departr and arriver and arriver <= departr:
            raise serializers.ValidationError({
                'arriver': "L'heure d'arrivée doit être supérieure à l'heure de départ."
            })

        return data


class ContenirSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contenir
        fields = '__all__'