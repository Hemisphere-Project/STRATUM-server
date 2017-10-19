#include <ArduinoJson.h>
#include <SPI.h>         // needed for Arduino versions later than 0018
#include <Ethernet2.h>
#include <EthernetUdp2.h>         // UDP library from: bjoern@cs.stanford.edu 12/30/2008

#define USE_DHCP 1 // Comment to force static IP
//#define DEBUG 1     // Comment to disable Serial
//#define DEBUG_MSG 1     // Comment to disable Received message print

byte mac[]    = {  0xDE, 0xED, 0xBA, 0xFE, 0xFE, 0xED };
char  nodeName[] = "HnodeY";  // a reply string to send back

IPAddress ip(192, 168, 0, 210);       // fallback IP address (if no DHCP available)
//IPAddress server(192, 168, 0, 32);
IPAddress server(192, 168, 0, 200);

const int INFO_TIME = 300;

EthernetUDP Udp;
unsigned int udpPort_node = 3738;  // local port to listen on
unsigned int udpPort_server = 3737;  // local port to speak to
const int MTUu = 1472;  // Usable MTU (1500 - 20 IP - 8 UDP)
byte incomingPacket[MTUu];  // buffer for incoming packets

#define WIZ_RESET 3
#define WIZ_CS 15

unsigned long lastUpdate = 0;
unsigned long lastData = 0;
unsigned long now = 0;
int dataRate = 10;  // measure data rate
int workTime = 10;  // measure data receiving and processing latency
int infoTime = 0;   // measure info sending latency

void setup()
{
  // SERIAL
  #if defined(DEBUG)
    Serial.begin(115200);
    delay(100);
    Serial.println("\nHello!");
  #endif

  // LEDS
  leds_init();
  leds_checker();
  leds_show();

  // RESET ethernet
  #if defined(WIZ_RESET)
    #if defined(DEBUG)
      Serial.print("Reset Ethernet interface... ");
    #endif
    pinMode(WIZ_RESET, OUTPUT);
    digitalWrite(WIZ_RESET, HIGH);
    delay(100);
    digitalWrite(WIZ_RESET, LOW);
    delay(100);
    digitalWrite(WIZ_RESET, HIGH);
    #if defined(DEBUG)
      Serial.println("done");
    #endif
  #endif

  // ETH start
  Ethernet.init(WIZ_CS);
  #if defined(USE_DHCP)
    if (Ethernet.begin(mac) == 0) {
      #if defined(DEBUG)
        Serial.println("DHCP failed... fallback to static");
      #endif
      Ethernet.begin(mac, ip);
    }
  #else
    Ethernet.begin(mac, ip);
  #endif
  #if defined(DEBUG)
    Serial.print("HNode IP: ");
    Serial.println(Ethernet.localIP());
  #endif


  // UDP Receiver
  Udp.begin(udpPort_node);
  #if defined(DEBUG)
    Serial.printf("Now listening at IP %s, UDP port %d\n", Ethernet.localIP().toString().c_str(), udpPort_node);
  #endif

}


void loop()
{
  // Store data receiving time
  now = millis();

  int packetSize = Udp.parsePacket();
  if (packetSize)
  {
    #if defined(DEBUG_MSG)
       Serial.printf("Received %d bytes from %s\n", packetSize, Udp.remoteIP().toString().c_str());
    #endif

    // receive incoming UDP packets
    int len = Udp.read(incomingPacket, MTUu);
    if (len > 0) incomingPacket[len] = 0;

    // UPDATE LEDs with data received
    leds_set(incomingPacket);

    // LED Update
    leds_show();

    #if defined(DEBUG_MSG)
      Serial.printf("UDP packet contents: %s\n", incomingPacket);
    #endif

    workTime = millis() - now;
    dataRate = millis() - lastData;
    lastData = millis();
  }

  now = millis();
  if (millis()-lastUpdate > INFO_TIME) {
    // make info

    StaticJsonBuffer<200> jsonBuffer;
    JsonObject& root = jsonBuffer.createObject();
    root["name"] = nodeName;
    root["processing"] = workTime + infoTime;
    root["dataRate"] = dataRate;
    root["port"] = udpPort_node;
    char message[200];
    root.printTo(message, sizeof(message));

    // send INFO
    Udp.beginPacket(server, udpPort_server);
    Udp.write(message);
    Udp.endPacket();
    lastUpdate = millis();

    #if defined(DEBUG_MSG)
      Serial.printf("INFO packet sent: %s\n", message);
    #endif

    infoTime = millis() - now;
  }

}
