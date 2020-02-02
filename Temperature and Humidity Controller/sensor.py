import sys
import Adafruit_DHT
from datetime import datetime
from time import sleep
from random import randint
from pymongo import MongoClient

def getSensor(dht_model):
	if dht_model is 11:
		sensor=Adafruit_DHT.DHT11 
	elif dht_model is 22:
		sensor=Adafruit_DHT.DHT22
	elif dht_model is 2302:
		sensor=Adafruit_DHT.AM2302
	else:
		sys.exit()
	return sensor

# class FormatSensorData:
# 	def __init__(self, _refID, temp, humid):
# 		self._refID=_refID
# 		self.temp=temp
# 		self.humid=humid
# 		self.date=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
def formatSensorData(_refID, temp, humid):
	return {
		"_refID": _refID,
		"temp": round(temp * 1.8 + 32, 2),
		"humid": humid,
		"date": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
	}
def getSensorData(SENSOR_SETUP):
	sensorData=[]
	for sensor in SENSOR_SETUP:
		_id=sensor['_id']
		dht_model=sensor['sensor']
		gpio_pin=sensor['pin']
		humid, temp = Adafruit_DHT.read_retry(getSensor(dht_model), gpio_pin)
		sensorData.append(formatSensorData(_id, temp, humid))
	return sensorData

def getSensorSetup(db):
	collection = db['sensors']
	SENSOR_SETUP=[]
	cursor = collection.find({}) # retrieves all the GPIO PINS + DHT model (11 or 22) data of your sensor setup 
	for document in cursor: # loop through each individual sensor in your setup
		SENSOR_SETUP.append(document)
		# SENSOR_SETUP.append({'_id': document['_id'], 'sensor': document['sensor'], 'pin': document['pin']}) # 
	return SENSOR_SETUP

def main():
	DB_USER="username"
	DB_PASS="password"
	client = MongoClient("ds219191.mlab.com", 19191)
	db = client['dht-sensors']
	if db.authenticate(DB_USER, DB_PASS):
		print("AUTH SUCCESS!")
		SENSOR_SETUP=getSensorSetup(db)
		if len(SENSOR_SETUP) >= 1:
			collection = db['sensor_readings']
			while(1):
				sensorData = getSensorData(SENSOR_SETUP)
				# datetime_object = datetime.strptime(sensorData[0].date, '%Y-%m-%d %H:%M:%S')
				# print(datetime_object)
				result = collection.insert_many(sensorData)
				sleep(60*60*1) # every hour
		else:
			print("NO SENSORS SETUP IN DATABASE!")
	else:
		print("AUTH NOT SUCCESSFUL!")

# class sensorData:
# 	_refID=StringField(required=True, max_length=200)
# 	gpio_pin=IntField(required=True)
# 	temp=IntField(required=True)
# 	humid=IntField(required=True)
# 	date=DatetimeField(default=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
# class sensor:
# 	_id=


if __name__ == "__main__":
	main()
