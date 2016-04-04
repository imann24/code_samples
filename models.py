# Author: Isaiah Mann
# Description: A models file for a Python Django Web Application for finding people to carpool with
from __future__ import unicode_literals
from django.db import models
import datetime
from geopy.geocoders import Nominatim
from carpool.bounding_box import BoundingBox
from carpool.algorithm import RouteAlgorithm
import math
split_char = "_"


# Represents a route
class Route(models.Model):
    def create (self, start_pos, end_pos, date=None):
        self.start_pos = start_pos
        self.end_pos = end_pos
        self.date = date

    def get_start(self):
        return self.start_pos

    def get_end(self):
        return self.end_pos

    def get_date(self):
        return self.date

    def __str__ (self):
        return str(self.start_pos) + "to" + str(self.end_pos)

# Abstract class to hold data for riders and drivers
class User(models.Model):
    nameFirst = models.TextField(default = '')
    nameLast = models.TextField(default = '')
    start = models.TextField(default = '')
    end = models.TextField(default = '')
    date = models.TextField(default = '')
    route = None

    def create (self, first_name, last_name, start, end, date):
        self.nameFirst = first_name
        self.nameLast = last_name
        self.start = start
        self.end = end
        date_string = date.split("/")
        self.date = datetime.date(
            int(date_string[2]),
            int(date_string[0]),
            int(date_string[1])
        )

        if (self.route == None):
            self.route = self.get_route()

        return self

    def __str__ (self):
        if (self.route == None):
            self.route = self.get_route()

        return (self.nameLast + split_char +
            self.nameFirst + split_char +
            self.start +split_char +
            self.end + split_char +
             str(self.date) + split_char + str(self.route))

    def get_type (self):
        return self.user_type

    # Uses a geocoder library: Geopy to determine latitude and longitude of an address
    def get_lat_lng_from_address (self, address):
        geolocator = Nominatim()
        location = geolocator.geocode(address)
        if (location == None):
            print ("Error: " + address + " is not valid")
            return None

        lat_lng = LatLng ()

        lat_lng.create (
            location.latitude,
            location.longitude
        )

        return lat_lng

    def get_start_lat_lng (self):
        return self.get_lat_lng_from_address(self.start)

    def get_end_lat_lng (self):
        return self.get_lat_lng_from_address(self.end)

    def get_route (self):
        start_lat_lng = self.get_start_lat_lng()
        end_lat_lng = self.get_end_lat_lng()

        if (start_lat_lng == None or end_lat_lng == None):
            print("Route is null")
            return None
        else:
            route = Route()

            route.create (
                start_lat_lng,
                end_lat_lng
            )

            return route

    class Meta:
        abstract = True


class Driver(User):
    user_type = models.CharField(max_length=10, default="Driver")


class Rider(User):
    user_type = models.CharField(max_length=10, default="Rider")

    # Given a particular rider, locates the riders the rider can pick up
    @staticmethod
    def get_suitable_riders (driver):
        # Initializes a new geolocator
        driver_route = driver.get_route()
        algorithm = RouteAlgorithm()

        suitable_riders = []

        for rider in Rider.objects.all():
            rider_route = rider.get_route()
            if (rider_route != None and algorithm.routes_compatible(
                driver_route,
                rider_route
            )):
                suitable_riders.append(rider)
        return suitable_riders

# Represents a coordinate
class LatLng(models.Model):
    lat = models.IntegerField()
    lng = models.IntegerField()

    def create(self, lat, lng, tag = None):
        self.lat = lat
        self.lng = lng
        self.tag = tag

    # Can add a string that's a tag if need be
    def set_tag(self, tag):
        self.tag = tag

    def set_lat(self, lat):
        self.lat = lat

    def set_lng(self, lng):
        self.lng = lng

    def get_lat_tag (self):
        return self.get_tag_param(1)

    def get_lng_tag (self):
        return self.get_tag_param(0)

    def get_tag_param (self, param_index):
        return self.tag.split(join_char)[param_index]

    def translate (self, delta_lat, delta_lng):
        self.lat += delta_lat
        self.lng += delta_lng

        # Accounts for wrap around
        self.lat = LatLng.wrap_lat(self.lat)
        self.lng = LatLng.wrap_lng(self.lng)

    # Uses pythagorean theorem to determine distance to another pos
    def distance (self, other_lat_lng):
        return math.sqrt(
            math.pow(self.lat - other_lat_lng.lat, 2) +
            math.pow(self.lng - other_lat_lng.lng, 2)
        )

    def __str__(self):
        lat_lng_as_string = (
            "\"lat\": " +
            str(self.lat) +
            ", \"lng\": " +
            str(self.lng)
        )

        if (self.tag != None):
            lat_lng_as_string += " Tag: " + self.tag

        return "{" + lat_lng_as_string + "}"

    # LatLng Util Functions
    @staticmethod
    def wrap_lat (lat):
        if (lat > 90):
            return lat - 180
        elif (lat < -90):
            return lat + 180
        else:
            return lat

    @staticmethod
    def wrap_lng (lng):
        if (lng > 180):
            return lng - 360
        elif (lng < -180):
            return lng + 360
        else:
            return lng
