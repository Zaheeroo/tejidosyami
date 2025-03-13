https://app.tilopay.com/api/v1/login
HEADERS
Content-Type application/json

Body raw
TILOPAY API
API necesarios para procesar transacciones por medio de Tilopay. Todos los datos de entradas son una guía solamente,
deben ser sustituidos por los datos de cada integración.

APIs necessary to process transactions through Tilopay.
All JSON data entries are a guide only, insert your own data for the integration.

Tilopay Checkout
POST Get Token Api
Obtención del token de seguridad necesaria para el consumo de los servicios.

Body

Api user y api password proporcionado en Admin - Tilopay Checkout.

Generated security token necessary for the consumption of the services.

Body

Api user and api password provided at Admin - Tilopay Checkout.

{
"apiuser" : "api_user",
"password" : "api_password"
}
https://app.tilopay.com/api/v1/processPayment
POST Process Payment
Obtención del url para formulario de pago.

Body

redirect : sitio donde espera la respuesta de la transacción (Obligatorio), ejemplo mywebsite.com, debe de soportar
el método GET , ejemplo de respuesta, a ese redirect
mywebsite.com?code=1&description=Transaction%20is%20approved.&auth=123456&order=TPYS-
881WROIBQA1405468&tpt=4300&crd=&tilopay-
transaction=4300&OrderHash=b02927cb2304774afd1fe97df1f6f066218ea34427289c1265f4e96c
&returnData=Tilopay-dataReturn123456789&form_update=ok
si code = 1, significa aprobada, caso contrario, rechazada.
OrderHash: es un string único por cada transacción, si desea usar para validar de su lado, escribir a
sac@tilopay.com para que le brinden instrucciones de cómo usarlo y asegurarse que el redirect no haya sido
manipulado.
key : es la llave relacionada con el cliente. (Obligatorio), puede obtnerla en Admin - Tilopay Checkout.
amount : monto de la compra (Obligatorio)
currency : moneda de la compra en formato ISO, ejemplo USD, CRC, GTQ... (Obligatorio)
billToFirstName : Nombre (Requerido)
billToLastName : Apellidos (Requerido)
billToAddress : Dirección (Requerido)
billToAddress 2 : Dirección2 (Requerido)
billToCity : Ciudad (Requerido)
billToState : Estado en formato ISO, ejemplo CR-SJ (San Jose, Costa Rica), US-CA (California, EEUU)... (Requerido)
billToZipPostCode : Código postal (Requerido)
billToCountry : País en código ISO Alpha-2, ejemplo CR (Costa Rica), US (EEUU), GT (Guatemala)... (Requerido)
billToTelephone : Teléfono (Requerido)
billToEmail : email (Obligatorio)
shipToFirstName : Nombre
shipToLastName : Apellidos
shipToAddress : Dirección
shipToAddress 2 : Dirección 2
shipToCity : Ciudad
shipToState : Estado en formato ISO, ejemplo CR-SJ (San Jose, Costa Rica), US-CA (California, EEUU)...
shipToZipPostCode : Código postal
shipToCountry : País en código ISO Alpha-2, ejemplo CR (Costa Rica), US (EEUU), GT (Guatemala)...
shipToTelephone : Teléfono
orderNumber : número de orden, puede alfanumérico (Obligatorio)
capture : Captura y autoriza 1 Sí 0 No (Obligatorio)
subscription : 1 para forzar que el cliente guarde la tarjeta en Tilopay, 0 para no (Obligatorio)
platform : Nombre de la plataforma donde es generada la transacción (Requerido)
returnData : Valor devuelto en la respuesta de Tilopay, puede enviar un valor que necesite recibir en la respuesta
final, se recomiendo enviar un string en base 64. (Opcional)
hashVersion : Utilizar solo en caso de implementar la verificación de hash, posibles valores [V1, V2], pod defecto se
usa V1 (Opcional)
Obtaining the url for the payment form.

Body

redirect : site transaction response (Mandatory) example mywebsite.com, must support GET method, example
response to the redirect:
mywebsite.com?code=1&description=Transaction%20is%20approved.&auth=123456&order=TPYS-
881WROIBQA1405468&tpt=4300&crd=&tilopay-
transaction=4300&OrderHash=b02927cb2304774afd1fe97df1f6f066218ea34427289c1265f4e96c
&returnData=Tilopay-dataReturn123456789&form_update=ok
if code = 1, means approved, otherwise, rejected.
OrderHash: It is a unique string for each transaction. If you want to use it to validate on your side, write to
sac@tilopay.com for instructions on how to use it and make sure that the redirect has not been changed.
key : the key associated with the client. (Mandatory)
amount : amount of the purchase (Mandatory)
currency : purchase currency in ISO format, example USD, CRC, GTQ... (Mandatory)
billToFirstName : First Name (Required)
billToLastName : Last Names (Required)
billToAddress : Address (Required)
billToAddress 2 : Address 2 (Required)
billToCity : City (Required)
billToState : State in ISO format, example CR-SJ (San Jose, Costa Rica), US-CA (California, EEUU)... (Required)
billToZipPostCode : Post Code (Required)
billToCountry : Country in ISO Alpha-2 code, example CR (Costa Rica), US (USA), GT (Guatemala)... (Required)
billToTelephone : Telephone (Required)
billToEmail : Email (Mandatory)
shipToFirstName : First Name (Required)
shipToLastName : Last Names (Required)
shipToAddress : Address (Required)
shipToAddress 2 : Address 2 (Required)
shipToCity : City (Required)
shipToState : State in ISO format, example CR-SJ (San Jose, Costa Rica), US-CA (California, EEUU)... (Required)
shipToZipPostCode : Post Code (Required)
shipToCountry : Country in ISO Alpha-2 code, example CR (Costa Rica), US (USA), GT (Guatemala)... (Required)
shipToTelephone : Telephone (Required)
orderNumber : Number of the order (Mandatory)
capture : Capture and authorizes 1 yes 0 No (Mandatory)
subscription : 1 to force the customer to save the card in Tilopay, 0 to not (Mandatory)
HEADERS
Authorization bearer [bearer token from GetToken method]

Accept application/json

Content-Type application/json

Body raw(json)
p py, ( y)
platform : Name of the platform where the transaction is generated (Required)
returnData : Value returned in the Tilopay response, you can send a value that you need to receive in the final
response, it is recommended to send a base 64 string. (Optional)
hashVersion : Use only in case of implementing hash verification, default V1, possible values [V1, V2] (Optional)
json
{
"redirect" : "https://www.urlToRedirect.com",
"key": "api_key",
"amount": "1.00",
"currency": "USD",
"orderNumber": "1212122",
"capture": "1",
"billToFirstName": "DEMO",
"billToLastName": "DEMO",
"billToAddress": "San Jose",
"billToAddress2": "Catedral",
"billToCity": "JS",
"billToState": "SJ",
"billToZipPostCode": "10061",
"billToCountry": "CR",
"billToTelephone": "88888888",
"billToEmail": "useremail@gmail.com",
"shipToFirstName":"DEMO",
"shipToLastName":"DEMO",
"shipToAddress":"San Jose",
"shipToAddress2":"Catedral",
"shipToCity":"JS",
"shipToState":"SJ",
"shipToZipPostCode":"10061",
"shipToCountry":"CR",
"shipToTelephone":"88888888",
"subscription": "0",
"platform": "api",
"returnData" : "dXNlcl9pZD0xMg==",
"hashVersion" : "V2"
}
https://app.tilopay.com/api/v1/processModification
HEADERS
Authorization bearer [bearer token from GetToken method]

Accept application/json

POST Process Modification
Permite la modificación de una transacción.

Body

type:
Captura
Reembolso
Reverso
key: es la llave relacionada con el cliente.
amount: monto que desea modificar.
orderNumber: es el numero la orden que se envió.
webhook: Para notificación de reembolsos programados manuales (opcional)
hashVersion: Utilizar solo en caso de implementar la verificación de hash, posibles valores [V1, V2], pod defecto se
usa V1 (Opcional)
Allows the modification of a transaction.

Body

type:
Capture
Refund
Reversal
key: key associated with the client.
amount: amout to be modified.
orderNumber: Number of the previously sent Order.
webhook: For notification of manual scheduled refunds (optional)
hashVersion: Use only in case of implementing hash verification, default V1, possible values [V1, V2] (Optional)
Content-Type application/json

Body raw(json)
https://app.tilopay.com/api/v1/consult
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
json
{
"orderNumber":"1214352",
"type":"2",
"amount":"1.00",
"key":"api_key",
"webhook":"",
"hashVersion":"V2"
}
POST Consult Especific Transaction
Endpoint de consulta de transacciones en TiloPay, obtiene el monto procesado y el estado de la transacción. Parámetros
key y orderNumber son requeridos.

Query endpoint for transactions in TiloPay, it obtains the processed amount and status of the transaction. key and
orderNumber parameters are required.

json
{
"key" : "api_key",
"orderNumber" : "1212122",
"merchantId" : ""
}
POST ProcessRecurrentPayment
https://app.tilopay.com/api/v1/processRecurrentPayment
HEADERS
Authorization bearer [bearer token from GetToken method]

Accept application/json

Content-Type application/json

Body raw(json)
POST Process Recurrent Payment
Permite procesar pagos recurrentes mediante un token de tarjeta guardado en Tilopay.

Body

redirect: Url de respuesta
key: es la llave relacionada con el cliente.
amount: monto de la compra.
currency: moneda de la compra en formato ISO, ejemplo USD, CRC, GTQ.
orderNumber: número de orden
capture: Captura y autoriza 1 Sí 0 No
email: email
card: token de la tarjeta
hashVersion: Utilizar solo en caso de implementar la verificación de hash, posibles valores [V1, V2], por defecto se
usa V1 (Opcional).
It allows to process recurring payments through a card token stored in Tilopay.

Body

redirect: site transaction response
key: the key associated with the client.
amount: amount of the purchase
currency: purchase currency in ISO format, example USD, CRC, GTQ
orderNumber: Number of the order
capture: Capture and authorizes 1 yes 0 No
email: email
card: card token
hashVersion: Use only in case of implementing hash verification, default V1, possible values [V1, V2] (Optional).
https://app.tilopay.com/api/v1/processTokenize
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
json
{
"redirect":"https://www.urlToRedirect.com",
"key":"api_key",
"amount":"10.00",
"currency":"USD",
"orderNumber":"1213",
"capture" : "1",
"email" : "myemail@exapmle.com",
"card" : "511111_00GOB1111"
}
POST Process Tokenize
Endpoint para realizar tokenización de tarjeta.

Body

redirect: sitio donde espera la respuesta de la transacción (Obligatorio)
key: Key asociado al comercio (Obligatorio)
email: Correo electronico del tarjeta habiente (Obligatorio)
language: Idioma [es, en] (Obligatorio)
firstname: Nombre del tarjeta habiente (Obligatorio)
lastname: Apellido del tarjeta habiente (Obligatorio)
Endpoint to perform card tokenization.

Body

redirect: site where it waits for the response of the transaction (Mandatory)
key: Key associated with the commerce (Mandatory)
email: Cardholder email (Mandatory)
language: language [es, en] (Mandatory)
firstname: Cardholder name (Mandatory)
lastname: Cardholder's last name (Mandatory)
Body raw(json)
https://app.tilopay.com/api/v1/getIntegrationSetting/api_key
HEADERS
Authorization bearer [bearer token from GetToken method]

https://app.tilopay.com/api/v1/consultTransactions
json
{
"redirect": "https://urlToRedirect.com",
"key": "api_key",
"email": "email@user.com",
"language": "es",
"firstName" : "name",
"lastName" : "lastname"
}
GET GET Integration Settings
Obtiene parametros de configuración de la integración en Tilopay.

Obtains configuration parameters of the integration in Tilopay.

POST Consult Transactions
key : Key de la integración Tilopay (Obligatorio)
startDate : Fecha de inicio Formato Y-m-d H:i:s "2022-01-15 00:00:00" (Obligatorio)
endDate : Fecha de fin Formato Y-m-d H:i:s "2022-08-01 23:59:59" (Obligatorio)
onlyAproved : Indica si obtener transacciones solo aprobadas o no [0, 1] (Opcional)

environment : Indica el ambiente de transacciones a obtener [0, 1] (Opcional)

Código Valor
0 Cualquiera
1 Solo aprobadas
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
url provided by tilopay
currency : Array de monedas que se desean obtener ["USD", "CRC"] (Opcional)
merchantId : Id de comercio (Opcional)
orderNumber : Numero de orden (Opcional)
email : Correo del cliente (Opcional)
auth : Numero de autorización (Opcional)

Código Valor
0 Producción
1 Pruebas
json
{
"key" : "api_key",
"startDate" : "2023-06-01 00:00:00",
"endDate" : "2023-06-30 23:59:59",
"onlyAproved" : 1 ,
"environment" : 1 ,
"currency" : ["USD", "CRC"],
"merchantId" : {{merchantId}},
"orderNumber" : "12135",
"email" : "customer@example.com",
"auth" : "123456"
}
POST Server to server
key : Llave relacionada con el comercio (obligatorio)
card : Número de tarjeta (obligatorio)
cvv : Código de seguridad (obligatorio)
expire : Fecha de expiración en formato mesAño (obligatorio)
name : Nombre del tarjetahabiente (requerido)

HEADERS
Authorization bearer {token from Get Token Api}

tx-proxy-key provided by tilopay

Body raw(json)
lastname : Apellidos del tarjetahabiente (requerido)
phone : Teléfono del cliente (requerido)
email : Correo del cliente (obligatorio)
address : Dirección del cliente (requerido)
city : Ciudad del cliente (requerido)
state : Estado en formato ISO, ejemplo CR-SJ (San José, Costa Rica), US-CA (California, EEUU) (requerido)
zipcode : Código postal (requerido)
country : País en código ISO Alpha-2, ejemplo CR (Costa Rica), US (Estados Unidos), GT (Guatemala) (requerido)
amount : Monto de la compra (obligatorio)
currency : Moneda de la compra en formato ISO, ejemplo USD, CRC, GTQ (obligatorio)
orderNumber : Número de orden (obligatorio)
capture : Captura y autoriza 1, solo autoriza 0 (obligatorio)
redirect : Url de respuesta (obligatorio)

json
{
"key" : "key",
"card" : "card PAN",
"cvv" : "CVV Number",
"expire" : "expire card (my) 1023",
"name" : "firstname",
"lastname" : "lastname",
"phone" : "88888888",
"email" : "email@user.com",
"address" : "user address",
"city" : "city",
"state" : "state",
"zipcode" : "zipcode",
"country" : "country",
"shipToFirstName":"Nombre",
"shipToLastName":"Apellido",
"shipToAddress":"San Jose",
"shipToAddress2":"Escazu",
"shipToCity":"San Jose",
"shipToState":"SJ",
"shipToZipPostCode":"10101",
"shipToCountry":"CR",
"shipToTelephone":"88778877",
"amount" : "amount",
"currency" : "currency code",
"orderNumber" : "Order Number",
https://app.tilopay.com/api/v1/user/card-remove
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
https://app.tilopay.com/api/v1/loginSdk
orderNumber : Order Number,
"capture" : 1 ,
"redirect" : "url to redirect"
}
POST Remove Card
Requisito: El comercio debe contar con una boveda de tokens privada.

key : Llave relacionada con el comercio (obligatorio)
email : Correo del cliente asociado al token (obligatorio)
token: Token a eliminar (obligatorio)

json
{
"key": "1234-1234-1234-1234-1234",
"email": "email@card.com",
"token": "411111.......1111"
}
Tilopay SDK
POST Get Token SDK
Obtención del token de seguridad necesaria para el consumo del SDK.

Body

HEADERS
Content-Type application/json

Body raw
https://app.tilopay.com/api/v1/createPlanRepeat
y
Puede obtnerlo en Admin - Tilopay Checkout.

Api user.
Api password
Api key.
Documentación SDK.

Generated security token necessary for the consumption of SDK.

Body

You can get at Admin - Tilopay Checkout.

Api user.
Api password
Api key.
SDK Documentation

{
"apiuser" : api_user,
"password" : api_password,
"key": api_key
}
Tilopay Repeat
POST Repeat - Create Plan
key : Key de la integración Tilopay (Obligatorio)
titl Titl dl l t (Obli t i )
title : Titulo del plan recurrente (Obligatorio)
description : Descripción del plan
frecuency : [1,2,3,4,5,6,7,8,9] Frecuencia de cobro
currency : Código de moneda en formato ISO 4217 (Obligatorio)
first_amount : Monto por pago inicial (Obligatorio)
trial : [0, 1] Activar periodo de prueba gratis 0: No, 1: Si (Obligatorio)
trial_days : Dias del periodo de prueba gratis (Obligatorio)
attempts : Cantidad de reintentos para cobros fallidos (Obligatorio)
modality : array de modalidades (Obligatorio)
thanks_url : Campo opcional, aquí puede ingresar una url de agradecimiento que haya personalizado, debe soportar
método GET.
webhook_subscribe : Campo opcional, aquí puede ingresar una url del webhook para recibir el callback cuando un
cliente adquiere una suscripción de forma exitosa. La url debe de ser de método POST para que reciba los datos en
la petición en el cuerpo de la solicitud, ejemplo de los datos enviados: {'id_plan' : 1, 'email' :
'email@email.com', 'modality' : 'ModalityName', 'amount' : 25, 'frequency' : '', 'coupon' :
'5HT5W8YT', 'free_trial' : 1, 'next_payment_date' : '2023-02-25'}
webhook_payment : Campo opcional, aquí puede ingresar una url del webhook para recibir el callback cuando se le
realiza el cargo al cliente de manera exitosa. La url debe de ser de método POST para que reciba los datos en la
petición en el cuerpo de la solicitud, ejemplo de los datos enviados: {'id_plan' : 1, 'email' :
'email@email.com', 'amount' : 25, 'auth' : '123456', 'orderNumber' : 'PRE123456'}
webhook_rejected : Campo opcional, aquí puede ingresar una url del webhook para recibir el callback cuando un
pago es fallido. La url debe de ser de método POST para que reciba los datos en la petición en el cuerpo de la
solicitud, ejemplo de los datos enviados: {'id_plan' : 1, 'email' : 'email@email.com', 'amount' :
25}
webhook_unsubscribe : Campo opcional, aquí puede ingresar una url del webhook para recibir el callback cuando
un cliente cancela la suscripción a uno de sus planes adquiridos. La url debe de ser de método POST para que
reciba los datos en la petición en el cuerpo de la solicitud, ejemplo de los datos enviados: {'id_plan' : 1,
'email' : 'email@email.com', 'expire' : '2023-02-25'}
webhook_reactive : Campo opcional, aquí puede ingresar una url del webhook para recibir el callback cuando un
cliente reactiva la suscripción a uno de sus planes. La url debe de ser de método POST para que reciba los datos en
Código Valor

1 Diario

2 Semanal

3 Mensual

4 Anual

5 Quincenal

6 Bimestral

7 Trimestral

8 Cuatrimestral

9 Semestral

HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
https://app.tilopay.com/api/v1/editPlanRepeat
p p p q
la petición en el cuerpo de la solicitud, ejemplo de los datos enviados: {'id_plan' : 1, 'email' :
'email@email.com', 'next_payment_date' : '2023-02-25'}
end_at : Fecha de finalización del plan recurrente, si no tiene fecha de fin enviar vacio. Formato d-m-Y (ejm: 25-09-
2022)
json
{
"key" : "api_key",
"title" : "Plan title",
"description" : "Plan description",
"frecuency" : 1 ,
"currency" : "USD",
"first_amount" : 0 ,
"trial" : 0 ,
"trial_days" : 0 ,
"attempts" : 1 ,
"modality" : [
{"title" : "Basic", "amount" : 10 },
{"title" : "Premium", "amount" : 30 }
],
"thanks_url" : "",
"webhook_subscribe" : "",
"webhook_payment" : "",
"webhook_rejected" : "",
"webhook_unsubscribe" : "",
"webhook_reactive" : "",
"end_at" : "25-10-2023"
}
POST Repeat - Edit Plan
key : Key de la integración Tilopay (Obligatorio)
id : Id del plan recurrente (Obligatorio)
title : Titulo del plan recurrente (Obligatorio)
description : Descripción del plan
frecuency : [1,2,3,4,5,6,7,8,9] Frecuencia de cobro
currency : Código de moneda en formato ISO 4217 (Obligatorio)
first_amount : Monto por pago inicial (Obligatorio)
trial : [0, 1] Activar periodo de prueba gratis 0: No, 1: Si (Obligatorio)
trial_days : Dias del periodo de prueba gratis (Obligatorio)
attempts : Cantidad de reintentos para cobros fallidos (Obligatorio)
status : [0,1,2] Estado del plan recurrente (Obligatorio)
thanks_url : Campo opcional, aquí puede ingresar una url de agradecimiento que haya personalizado, debe soportar
método GET.
webhook_subscribe : Campo opcional, aquí puede ingresar una url del webhook para recibir el callback cuando un
cliente adquiere una suscripción de forma exitosa. La url debe de ser de método POST para que reciba los datos en
la petición en el cuerpo de la solicitud, ejemplo de los datos enviados: {'id_plan' : 1, 'email' :
'email@email.com', 'modality' : 'ModalityName', 'amount' : 25, 'frequency' : '', 'coupon' :
'5HT5W8YT', 'free_trial' : 1, 'next_payment_date' : '2023-02-25'}
webhook_payment : Campo opcional, aquí puede ingresar una url del webhook para recibir el callback cuando se le
realiza el cargo al cliente de manera exitosa. La url debe de ser de método POST para que reciba los datos en la
petición en el cuerpo de la solicitud, ejemplo de los datos enviados: {'id_plan' : 1, 'email' :
'email@email.com', 'amount' : 25, 'auth' : '123456', 'orderNumber' : 'PRE123456'}
webhook_rejected : Campo opcional, aquí puede ingresar una url del webhook para recibir el callback cuando un
pago es fallido. La url debe de ser de método POST para que reciba los datos en la petición en el cuerpo de la
solicitud, ejemplo de los datos enviados: {'id_plan' : 1, 'email' : 'email@email.com', 'amount' :
25}
Código Valor

1 Diario

2 Semanal

3 Mensual

4 Anual

5 Quincenal

6 Bimestral

7 Trimestral

8 Cuatrimestral

9 Semestral

Código Valor

0 Inactivo

1 Activo

2 Activo pero sin registros nuevos

HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
https://app.tilopay.com/api/v1/getPlanRepeat
webhook_unsubscribe : Campo opcional, aquí puede ingresar una url del webhook para recibir el callback cuando
un cliente cancela la suscripción a uno de sus planes adquiridos. La url debe de ser de método POST para que
reciba los datos en la petición en el cuerpo de la solicitud, ejemplo de los datos enviados: {'id_plan' : 1,
'email' : 'email@email.com', 'expire' : '2023-02-25'}
webhook_reactive : Campo opcional, aquí puede ingresar una url del webhook para recibir el callback cuando un
cliente reactiva la suscripción a uno de sus planes. La url debe de ser de método POST para que reciba los datos en
la petición en el cuerpo de la solicitud, ejemplo de los datos enviados: {'id_plan' : 1, 'email' :
'email@email.com', 'next_payment_date' : '2023-02-25'}
end_at : Fecha de finalización del plan recurrente, si no tiene fecha de fin enviar vacio. Formato d-m-Y (ejm: 25-09-
2022)
json
{
"key" : "api_key",
"id" : 3 ,
"title" : "Plan title",
"description" : "Plan description",
"frecuency" : 2 ,
"currency" : "USD",
"first_amount" : 0 ,
"trial" : 0 ,
"trial_days" : 0 ,
"attempts" : 5 ,
"status" : 1 ,
"thanks_url" : "",
"webhook_subscribe" : "",
"webhook_payment" : "",
"webhook_rejected" : "",
"webhook_unsubscribe" : "",
"webhook_reactive" : "",
"end_at" : "25-10-2023"
}
POST Repeat - Get Plan
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
https://app.tilopay.com/api/v1/deletePlanRepeat
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
key : Key de la integración Tilopay (Obligatorio)

id : Id del plan recurrente (Obligatorio)

json
{
"key" : "api_key",
"id" : "3"
}
POST Repeat - Delete Plan
key : Key de la integración Tilopay (Obligatorio)

id : Id del plan recurrente (Obligatorio)

json
{
"key" : "api_key",
"id" : "625"
}
POST R G S i Pl
https://app.tilopay.com/api/v1/getSuscriptorRepeat
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
https://app.tilopay.com/api/v1/editSuscriptorRepeat
HEADERS
POST Repeat - Get Suscriptor Plan
key : Key de la integración Tilopay (Obligatorio)

id : Id del plan recurrente (Obligatorio)

json
{
"key" : "api_key",
"id" : "2"
}
POST Repeat - Edit Suscriptor Plan
key : Key de la integración Tilopay (Obligatorio)

id : Id del suscriptor (Obligatorio)

status : [1,3,4] Estado del suscriptor

expire : Fecha de expiración del plan en formato yy-m-d

Código Valor
1 Activo
3 Pausado
4 Eliminado
Authorization bearer [bearer token from GetToken method]

Body raw(json)
https://app.tilopay.com/api/v1/deleteSuscriptorRepeat
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
https://app.tilopay.com/api/v1/pauseSuscriptorRepeat
json
{
"key" : "api_key",
"id" : "2",
"status" : "2",
"expire" : "2023-10-25"
}
POST Repeat - Delete Suscriptor Plan
key : Key de la integración Tilopay (Obligatorio)

id_suscriptor : Id del suscriptor (Obligatorio)

json
{
"key" : "api_key",
"id_suscriptor" : "1"
}
POST Repeat - Pause Suscriptor Plan
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
https://app.tilopay.com/api/v1/reactiveSuscriptorRepeat
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
key : Key de la integración Tilopay (Obligatorio)

id_suscriptor : Id del suscriptor (Obligatorio)

json
{
"key" : "api_key",
"id_suscriptor" : "1"
}
POST Repeat - Reactive Suscriptor Plan
key : Key de la integración Tilopay (Obligatorio)

id_suscriptor : Id del suscriptor (Obligatorio)

json
{
"key" : "api_key",
"id_suscriptor" : "1"
}
https://app.tilopay.com/api/v1/recurrentUrl
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
https://app.tilopay.com/api/v1/getLinkPaymentList/api_key/limit
POST Repeat - Get Consult URL
Query endpoint for get url to register and renew plan recurrent in TiloPay, it obtains the url register for new users, and get
url renew if email user is registered.

Consulta el endpoint para obtener el URL de registro y renovación del plan recurrente en TiloPay, obtiene el URL de
registro para nuevos usuarios y obtiene el URL renovación si el correo electrónico está registrado.

key : Key de la integración Tilopay (Obligatorio)

id : Id del plan recurrente (Obligatorio)

email : Email del usuario que se quiere crear link de registro

json
{
"key" : "api_key",
"id" : "1",
"email" : "email@user.com"
}
Tilopay link
Products or Services Catalog
GET Link - Payment Item List
HEADERS
Authorization bearer [bearer token from GetToken method]

https://app.tilopay.com/api/v1/getLinkPaymentById/link_payment_id/api_key
HEADERS
Authorization bearer [bearer token from GetToken method]

https://app.tilopay.com/api/v1/createLinkPayment
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
GET Link - Payment By Id
POST Link - Create Payment Link
key : Key de la integración Tilopay (Obligatorio)
amount : Monto para el link de pago (Obligatorio)
currency : Código de moneda en formato ISO 4217 (Obligatorio)
reference : Referencia del link de pago
type : [0,1] Tipo de link, 0 para ilimitado, 1 para solo una vez
description : Descripción del pago
client : Nombre del cliente, aplica solo cuando type es 1
callback_url : Url para redireccionar y dar la respuesta al completar el pago. La url debe de ser de método GET para que
reciba los datos, ejemplo de los datos enviados:
code=Val&description=Val&auth=Val&tilopayLinkId=Val&orderNumber=Val&tilopayOrderId=Val&creditCa
rdToken=Val&creditCardBrand=Val&last4CreditCardNumber=Val&orderHash=Val

json
{
"key" :"api key"
https://app.tilopay.com/api/v1/getDetailLinkPayment/link_payment_id/api_key
HEADERS
Authorization bearer [bearer token from GetToken method]

https://app.tilopay.com/api/v1/deleteLinkPayment
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
key : api_key,
"amount" : "10",
"currency" : "USD",
"reference" : "123456",
"type" : 0 ,
"description" : "Description",
"client" : "Client name",
"callback_url" : ""
}
GET Link - Detail Payment Link
Este metodo no requiere el envio de parametros en el cuerpo de la solicitud.

En el URL de consulta debe sustituir link_payment_id por el id del link de pago a solicitar, y api_key por el Api Key del
comercio.

POST Link - Delete Payment
key : Key de la integración Tilopay (Obligatorio)

id : Id del link de pago (Obligatorio)

json
{
"key" : "api key",
https://app.tilopay.com/api/v1/collect/get/groups
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
https://app.tilopay.com/api/v1/collect/get/affiliates
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
key : api_key,
"id" : "35"
}
Tilopay Collect
POST Get Groups
json
{
"key" : "api_key"
}
POST Get Affiliates
https://app.tilopay.com/api/v1/collect/get/massive
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
https://app.tilopay.com/api/v1/collect/get/massive/detail
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
json
{
"key" : "api_key",
"group" : 0
}
POST Get Massive Collections
json
{
"key" : "api_key"
}
POST Detail Massive collections
json
{
https://app.tilopay.com/api/v1/collect/set/group
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
https://app.tilopay.com/api/v1/collect/set/urlaffiliate
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
{
"key" : "api_key",
"code" : "UnBSdXN0bnZSc0owVXdvU1haVisxZz09"
}
POST Create Group
json
{
"key" : "api_key",
"currency" : "USD",
"amount" : "100.00",
"name" : "Grupo Name"
}
POST Create Affiliate URL
json
https://app.tilopay.com/api/v1/collect/set/urlgroup
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
https://app.tilopay.com/api/v1/collect/edit/affiliate
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
{
"key" : "api_key",
"name" : "Name link",
"currency" : "USD",
"base_amount" : "5.00",
"amount_max_daily" : "10.00",
"amount_max_month" : "100.00"
}
POST Create group URL
json
{
"key" : "api_key",
"name" : "Name link",
"group" : "1",
"currency" : "USD",
"base_amount" : "5.00",
"amount_max_daily" : "10.00",
"amount_max_month" : "100.00"
}
POST Edit Affiliate
y j
https://app.tilopay.com/api/v1/collect/edit/group
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
json
{
"key" : "api_key",
"affiliateid" : 2 ,
"name" : "Juan",
"lastname" : "Lopez",
"company" : "Tilo",
"phone" : "88998877",
"address" : "Escazu",
"city" : "San Jose",
"state" : "SJO",
"zipcode" : "10101",
"country" : "CR",
"base_amount" : "10.00"
}
POST Edit Group
json
{
"key" : "api_key",
"groupid" : 1 ,
"amount" : "800.00",
"name" : "Grupo Name"
}
https://app.tilopay.com/api/v1/collect/set/payments
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
POST Create payments
json
{
"key" : "api_key",
"capture" : 1 ,
"reason" : "Cobro mensualidad",
"users" : [
{
"id" : "5",
"amount" : "500.00",
"currency" : "CRC",
"date" : ""
},
{
"id" : "32",
"amount" : "1000.00",
"currency" : "CRC",
"date" : "2024-06-20"
},
{
"id" : "25",
"amount" : "10.00",
"currency" : "USD",
"date" : "2024-06-20"
}
],
"groups" : [
{
"id" : "10",
"amount" : "25.00",
"currency" : "USD",
"date" : ""
}
]
}
https://app.tilopay.com/api/v1/orders/liquidation/split
}
Liquidation
POST Split
Este endpoint brinda la posibilidad de divir la liquidaciones entre otros comercios, solo aplica para comercios que usan los
servicios de Tilopay como facilitador de pago, la nuevas ordenes resultante de la partición se podran identificar por el
prefijo SL| {{orderNumber}}, reglas para aplicar:

Deben de esatr aprobados y que sean del mismo país.
Si la partición es menor al monto total de la orden, el restante se le asigna al comercio que realizo la transacción
original.
Solo sobre ordenes aprobadas complentamente.
Body

Campos del payload:

order id: el id de la orden- aprobada en Tilopay, obligatorio
commerces: un array asociativo que contiene las llaves email y amount de cada comercio con que se desea
parcionar la liquidación de la orden, opcional incluir el comercio propietario, caso contrario si no se especifica el
monto para el comercio propietario, se asignara si hay excendete de la parción, mismo caso aplica si se incluye y
hay excente, se le sumara al propietario, obligatorio.
lang: idioma de la solicitud, opcional.
This endpoint offers the possibility of dividing the settlements among other merchants, it only applies to merchants that
use Tilopay services as a payment facilitator, the new orders resulting from the partition can be identified by the prefix SL|
{{orderNumber}}, rules to apply:

Must be approved and be from the same country.
If the partition is less than the total amount of the order, the remainder is assigned to the merchant that made the
original transaction.
Only on fully approved orders.
Body

Payload fields:

order id: the id of the order-approved in Tilopay, mandatory.
commerces: associative array that contains the email keys and amount of each merchant with which the settlement
of the order is to be divided, optionally the owner merchant is included, otherwise if the amount for the owner
merchant is not specified it will be assigned if there an is excedent of the partition, in the same case if it is included
HEADERS
Authorization bearer [bearer token from GetToken method]

Body raw(json)
and there is an excedent, it will be added to the owner, obligatorily.
lang: Request language, optional.
json
{
"order_id": "1",
"commerces": [
{
"email": "commerce-1@example.com",
"amount": "7.5"
},
{
"email": "commerce-2@example.com",
"amount": "5.5"
}
],
"lang": "en"
}