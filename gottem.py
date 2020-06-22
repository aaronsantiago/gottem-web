# subscribePython.py
import paho.mqtt.client as mqtt
import time

# callbacks
def on_connect(client, userdata, flags, rc):
    print("Connected with Code: " + str(rc))
    # subscribe topic
    client.subscribe("pork/test/test")

def on_message(client, userdata, msg):
    parsedMessage = str(msg.payload)[2:-1].split(":")

    # name and arg are sent by the detection website or the debug website
    name = parsedMessage[0]
    arg = float(parsedMessage[1])

    if name == "arm":
    	print ("received arm set to: " + str(arg))

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect("broker.shiftr.io", 1883, 60)
client.username_pw_set("b11edbdc", "ba2b56875ff12d8c")

client.loop_forever()
"""
curl -X POST "http://b11edbdc:ba2b56875ff12d8c@broker.shiftr.io/pork/test/test" -d "flash that light"
"""