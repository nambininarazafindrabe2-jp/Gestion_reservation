from datetime import date, time

from rest_framework.test import APITestCase

from reservation.models import Client, Reservation, Voiture


class ClientContactApiTests(APITestCase):
    def create_client(self, codec, contact='0321234567'):
        return self.client.post(
            '/api/clients/',
            {'codec': codec, 'nomc': 'Rabe', 'prenomc': 'Rija', 'contact': contact},
            format='json',
        )

    def test_accepts_ten_digits_and_preserves_leading_zero(self):
        response = self.create_client('C01')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['contact'], '0321234567')
        self.assertIsInstance(response.data['contact'], str)

    def test_rejects_invalid_contacts(self):
        invalid_contacts = (
            '032123456a',
            '03212345!7',
            '032123456',
            '03212345678',
            '032 1234567',
            ' 0321234567',
            '0321234567 ',
            321234567,
        )
        for index, contact in enumerate(invalid_contacts):
            with self.subTest(contact=contact):
                response = self.create_client(f'C{index}', contact)
                self.assertEqual(response.status_code, 400)
                self.assertIn('contact', response.data)

    def test_client_list_is_sorted_descending_without_losing_rows(self):
        for codec in ('C01', 'C03', 'C02'):
            self.assertEqual(self.create_client(codec).status_code, 201)

        response = self.client.get('/api/clients/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual([client['codec'] for client in response.data], ['C03', 'C02', 'C01'])

    def test_reservation_list_is_sorted_descending_without_losing_rows(self):
        client = Client.objects.create(
            codec='C01', nomc='Rabe', prenomc='Rija', contact='0321234567'
        )
        voiture = Voiture.objects.create(numv='V01', marqueV='Bus')
        for coder in ('R01', 'R03', 'R02'):
            Reservation.objects.create(
                coder=coder,
                datesr=date.today(),
                departr=time(8, 0),
                arriver=time(12, 0),
                placesr='1',
                nombrep=1,
                codec=client,
                numv=voiture,
            )

        response = self.client.get('/api/reservations/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual([reservation['coder'] for reservation in response.data], ['R03', 'R02', 'R01'])
