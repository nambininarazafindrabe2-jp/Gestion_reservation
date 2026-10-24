from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Client(models.Model):
    codec = models.CharField(primary_key=True, max_length=20, db_column='CODEC')
    nomc = models.CharField(max_length=60, db_column='NomC')
    prenomc = models.CharField(max_length=60, db_column='PrenomC')
    contact = models.CharField(max_length=20, db_column='Contact')

    class Meta:
        db_table = 'CLIENTS'

    def __str__(self):
        return f"{self.codec} - {self.nomc} {self.prenomc}"
class Voiture(models.Model):
    numv = models.CharField(primary_key=True, max_length=30, db_column='NUMV')
    marqueV = models.CharField(max_length=60, db_column='MarkV')
    capaciteV = models.IntegerField(
        default=32,
        db_column='NbPlacesMax',
        validators=[
            MinValueValidator(18, message="La capacité minimale est de 18 places."),
            MaxValueValidator(32, message="La capacité maximale est de 32 places."),
        ],
    )

    class Meta:
        db_table = 'VOITURE'

    def __str__(self):
        return f"{self.numv} - {self.marqueV} ({self.capaciteV} places)"

class Trajet(models.Model):
    destinations = models.CharField(max_length=100, primary_key=True, db_column='DESTINATIONS')
    frais = models.DecimalField(max_digits=10, decimal_places=2, db_column='Frais')

    class Meta:
        db_table = 'TRAJET'

    def __str__(self):
        return f"{self.destinations} ({self.frais} Ar)"

class Reservation(models.Model):
    coder = models.CharField(primary_key=True, max_length=30, db_column='CODER')
    datesr = models.DateField(db_column='DatesR')
    departr = models.TimeField(db_column='DepartR')
    arriver = models.TimeField(db_column='ArriveR')
    placesr = models.CharField(max_length=60, db_column='PlacesR')
    nombrep = models.IntegerField(db_column='NombreP')
    codec = models.ForeignKey(Client, on_delete=models.CASCADE, db_column='CODEC', related_name='reservations')
    numv = models.ForeignKey(Voiture, on_delete=models.CASCADE, db_column='NUMV', related_name='reservations')

    class Meta:
        db_table = 'RESERVATIONS'

    def __str__(self):
        return f"Réservation N°{self.coder} - {self.codec.nomc}"
class Contenir(models.Model):
    coder = models.ForeignKey(Reservation, on_delete=models.CASCADE, db_column='CODER', related_name='contenus')
    destinations = models.ForeignKey(Trajet, on_delete=models.CASCADE, db_column='DESTINATIONS', related_name='contenus')
    montants = models.DecimalField(max_digits=10, decimal_places=2, db_column='Montants')

    class Meta:
        db_table = 'CONTENIR'
        unique_together = (('coder', 'destinations'),)

    def __str__(self):
        return f"Réservation {self.coder.coder} -> {self.destinations.destinations}"