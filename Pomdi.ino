

#include "Arduino.h"

#include "print_debug.h"
#include "SD.h"
#include "aJSON_DUE.h"
#include "misc.h"
#include "watchdog.h"
#include "global.h"
#include "email_tools.h"
#include "WebSocketServer.h"
#include "Ethernet_setup.h"

#include "Analog_sensors.h"

#include "SPI.h"
#include "PlainFFT.h"

#include "sampling.h"
#include "Analog_sensors.h"

#include "Ethernet.h"
#include "cortex.h"

#include "ping.h"


byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };

IPAddress IP_server(192, 168, 1, 111); ; // IP  with port 8080
int server_port = 8080; 

//char IP_server[] = "conectto.ddns.net"; // IP Raspberry with port 8080
// Raspberry


//Number of channels
#define Na 1
Analog_sensor Analog_sensors[Na];



//********************************************************************************
//* A0: 230 Vols, A1:  MIC, A2: 0.1 v, A3:3.3 v,  A4-A13: mini jack connector
//********************************************************************************
void Analog_initial_setup()
{

    Serial.println("  Analog Setup ...  ");
    Analog_sensors[0].value = 0;
    Analog_sensors[0].ch1 = 4;
    Analog_sensors[0].ch2 = -1;
    Analog_sensors[0].magnitude = "Power";

}


void setup()
{
    bool automatic_gain, sampling_debugging, oversampling;
    double T_period;
 
    watchdog_setup(24.0); // 4 

    automatic_gain = false; sampling_debugging = false;  oversampling = true; T_period = 20000.0;
    sampling_setup(automatic_gain, sampling_debugging, oversampling, T_period);

    Serial.begin(115200);
    Serial.println("**************Reset AtenTTo************");
    Serial.println("Embedded Software Version JAHR: 2021.05.05");

    ethernet_setup(mac);             // Automatic IP, DNS,...

    Analog_initial_setup();

    Serial.print("IP_server :"); Serial.println(IP_server);
    Serial.print("port: ");  Serial.println(server_port);

    Start_sound();
    
    delay(2000); 
}


void loop()
{
    char state[200];
    long int t1, t2, N;
    EthernetClient client;

    if (client.connect(IP_server, server_port))
    {
        Serial.print("IP_server ="); Serial.println(IP_server);
        Serial.print("port="); Serial.println(server_port);
        while( client.connected() )
        {
         t1 = millis();
         watchdog_restart();
         read_Analog_sensors_power( Analog_sensors, Na ); 
         sprintf(state, "?time=%ld&power=%.2f", t1, Analog_sensors[0].value);
         N = POST_message(client, state, "ARCOS");
         t2 = millis();
         print(str("___________POST millis = ")); print(t2 - t1); // 320 millis FFT + 1 ms POST 
         print(str("   bytes N  = ")); println(N);
        }
        client.stop(); 

    }

}

long int POST_message(EthernetClient client, char state[], char facility_name[])
{
    long int N; 

    char message[200];

    strcpy(message, "POST /");
    strcat(message, facility_name);
    strcat(message, state);
    strcat(message, " HTTP/1.1");
    N = client.println(message);
    client.println();

    return N; 

}

