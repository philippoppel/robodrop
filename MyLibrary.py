import requests
import time

class MyLibrary:

    def __init__(self):
        self.url = "http://192.168.178.44/move_servos"

    def move_arm(self, angles):
        """
        Bewegt den Roboterarm zu den angegebenen Winkeln.
        :param angles: Liste der Winkel für jeden Servo.
        """
        requests.post(self.url, json={"angles": angles})
        time.sleep(1)

    def wave_arm(self):
        """
        Führt eine Winke-Bewegung mit dem Roboterarm aus.
        """
        # Ausgangsposition
        self.move_arm([90, 90, 90, 90, 45])

        # Winken
        for _ in range(3):
            self.move_arm([90, 90, 90, 90, 45])
            self.move_arm([90, 120, 90, 90, 45])

        for _ in range(3):
            self.move_arm([90, 90, 90, 30, 45])
            self.move_arm([90, 90, 90, 140, 45])

        # Rückkehr zur Ausgangsposition
        self.move_arm([90, 90, 90, 90, 45])
