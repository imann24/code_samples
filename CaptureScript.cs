/*
 * Author: Isaiah Mann
 * 
 * Description: 
 * CaptureScript is used for the element drop zones
 * It captures the elements when they're dragged/dropped in
 * It deques the elements when they're tapped/dragged out
 * Different behavior based off the gathering and the crafting zones
 * Also attached to the compiler for the drag out behavior
 */

/// <summary>
/// DEBUG is a preprocessor directive used in many scripts to print debugging statements and perform other debugging actions
/// Commenting it out will also comment out all the code wrapped in #if DEBUG statements
/// It can then be uncommented again when debugging is needed again
/// </summary>
/// 
//#define DEBUG

using UnityEngine;
using UnityEngine.UI;
using System;
using System.Collections;
using System.Collections.Generic;

//captures the gameobject that comes near it and locks it position to the parent's position
public class CaptureScript : MonoBehaviour {
	#region Events
	// Delegates used to call events
	public delegate void ToggleGatheringZoneReadyAction(int zoneIndex, bool zoneActive);
	public delegate void CaptureElementAction();
	public delegate void ClearElementAction();

	// When the zone's elements is queued or dequeued
	public static event ToggleGatheringZoneReadyAction OnToggleGatheringZone;

	// When the zone captures a new element
	public static event CaptureElementAction OnElementCaptured;

	// When the zone clears out an element
	public static event ClearElementAction OnElementCleared;
	#endregion

	//tunable strings
	public string noElement = "--";
	public string noElementCount = "-";

	//reference to elements + universal variables between crafting and gathering functions
	private bool hasCapturedElement;
	private GameObject capturedElementSpawner;
	private int zoneNumber;

	//the hidden element icon on the drop zone
	private Image myElement;
	public GameObject myElementGameObject;
	private Sprite defaultIcon;

	//sprites and text and an animator
	//for gathering
	public Image zoneReadyIndicator;
	public Image zoneEmptyIndicator;

	// References to the sprites/texts that display the elmeent
	private static Sprite capturedIconSprite;
	private static Sprite emptyIconSprite;
	private Image myImage;
	public Text elementName;
	public Animator myAnimator;

	//changes between two functions of drop zone
	private enum Mode {Gathering, Crafting, Deleting, Compiler};
	private Mode mode;

	//for crafting 
	public CraftingControl crafter;
	public Text elementCount;
	public Image elementAmountBar;
	public Image bioCombatBar;
	public Image elementClassBar;

	//for gathering 
	public CraftingButtonController gatheringControl;
	public Text zoneReadyText {get; private set;} 
	private bool allElementsInZones; 
	
	// Use this for initialization
	void Start () {
		// Establishes the references to the components that are children
		for (int i = 0; i < GetComponentsInChildren<Text>().Length; i++) {
			Text currentText = GetComponentsInChildren<Text>()[i];
			if (currentText.name == "ZoneReadyText") {
#if DEBUG
				Debug.Log("Found the zone ready text");
				zoneReadyText = currentText;
#endif
			}
		}

		// Gets the reference to the captured element zone icon (background icon)
		if (capturedIconSprite == null && transform.childCount > 0) {
			for (int i = 0; i < transform.childCount; i++) {
				if (transform.GetChild(i).name == "Element") {
					capturedIconSprite = transform.GetChild(i).GetComponent<Image>().sprite;
				}
			}
		}

		// Gets the reference to the empty zone icon
		if (emptyIconSprite == null && transform.childCount > 0) {
			emptyIconSprite = GetComponent<Image>().sprite;
		}

		// Gets the reference to the image
		myImage = GetComponent<Image>();

		// Sets the mode which determines how the crafting controller functions
		if (transform.childCount > 0) {
			for (int i = 0; i < transform.childCount; i++) {
				if (transform.GetChild(i).name == "Element") {
					myElement = transform.GetChild (i).GetComponent<Image>();
					myElementGameObject = transform.GetChild(i).gameObject;
				}
			}
			defaultIcon = myElement.sprite;
		}

		// The behavior for a gathering zone
		if (transform.parent.name.Contains ("Gathering")) {
			mode = Mode.Gathering;
			zoneNumber = transform.GetSiblingIndex()+1;
#if DEBUG
			Debug.Log("Zone number = " + zoneNumber);
#endif
			zoneReadyIndicator.enabled = false;

			//calls the event
			callGatheringZoneToggledEvent(false);

			// Disabling the text if the mode is switched to gathering.
			SetElementTextAndStatus(elementName, elementName.text, false);

			SetElementTextAndStatus(zoneReadyText, "", true);

			//sets the bool to determine whether there are elements in all four zones
			allElementsInZones = false;

			//event to set the zone ready text
			CraftingButtonController.OnReadyToEnterGathering += setReadyToEnterText;
			CraftingButtonController.OnNotReadyToEnterGathering += setNotReadyToEnterText;

		} else if (transform.parent.name.Contains("Crafting")) {
			mode = Mode.Crafting;
			zoneNumber = transform.GetSiblingIndex()+1;
			resetText();

			//to control the inventory bar
			CraftingControl.OnElementCreated += updateInventoryBarFill;
			updateInventoryBarFill(0);
			updateBioCombatBar(0);
			updateClassBar(0);
		} else if (transform.name.Contains("Delete")) {
			mode = Mode.Deleting;
		} else if (transform.parent.name.Contains("Result")) {
			mode = Mode.Compiler;
			myElement = transform.GetComponent<Image>();
		}


#if DEBUG
		Debug.Log("My mode is: " + mode + " for Gameobject " + gameObject.name);
#endif

	}

	void OnDestroy () {
		CraftingControl.OnElementCreated -= updateInventoryBarFill;

		//unsubscribes from event to set the zone ready text
		CraftingButtonController.OnReadyToEnterGathering -= setReadyToEnterText;
		CraftingButtonController.OnNotReadyToEnterGathering -= setNotReadyToEnterText;
	}

	//forces element to delete even if it doesn't have a captured element
	public void OnMouseDown () {

#if DEBUG
		Debug.Log("In this mode: " + ScrollBarDisplay.mode);
#endif
		//destroys the element if clicked on
		if (hasCapturedElement) {
			//calls the event
			if (OnElementCleared != null) {
				OnElementCleared();
			}

			//hides the element
			myElement.sprite = defaultIcon;
			myElement.enabled = false;
			if (mode != Mode.Compiler) {
				myImage.sprite = emptyIconSprite;

				//gets the name for player prefs
				string name = myElementGameObject.name;
			
				//resets the name
				myElementGameObject.name = "NoElement";
			} 

			hasCapturedElement = false;

			if (mode == Mode.Crafting) {
				crafter.setZoneAsEmpty (zoneNumber);

				//resets the fill bar for the element
				elementAmountBar.fillAmount = 0;
				bioCombatBar.fillAmount = 0;
				elementClassBar.fillAmount = 0;
				resetText();
			} else if (mode == Mode.Gathering) {
				gatheringControl.toggleZoneReadyGathering(this);
				zoneReadyIndicator.enabled = false;

				//calls the event
				callGatheringZoneToggledEvent(false);

				//disables the element name and element combo text
				SetElementTextAndStatus(elementName, elementName.text, false);

				//clears the zone
				SetElementTextAndStatus(zoneReadyText, "", true);

				//sets the bool to determine whether there are elements in all four zones
				allElementsInZones = false;
			} 
		}
	}

	//locks the element into the drop zone
	void OnTriggerEnter2D (Collider2D collided) {
		//print ("Trigger");
		if (mode == Mode.Deleting) {
			if (GlobalVars.CRAFTING_ACTIVE) {
				PlayerPrefs.SetInt(collided.name, PlayerPrefs.GetInt(collided.name)+1);
			} 
			Destroy(collided.gameObject);
			return;
		}
		//print(collided.tag);
		if (collided.tag == GlobalVars.ELEMENT_TAG && collided.name != "ElementPrefab" && !hasCapturedElement && mode != Mode.Compiler) {
			//captures the element and destroys the dragged in object

			captureElement(collided.gameObject.transform.GetComponent<Image>().sprite);
			Destroy(collided.gameObject);
		} else if (collided.tag == GlobalVars.ELEMENT_TAG) {
			collided.GetComponent<CaptureMe>().setCapturer(this);
		}
	}

	void OnTriggerExit2D (Collider2D collided) {
		if (collided.tag == GlobalVars.ELEMENT_TAG) {
			collided.GetComponent<CaptureMe>().setCapturer(null);
		}
	}

	public void captureElement (Sprite element) {
		if (mode == Mode.Compiler) { 
			return;
		} else {
			//raises the flag
			hasCapturedElement = true;

			//calls the event
			if (OnElementCaptured != null) {
				OnElementCaptured();
			}

			//checks if it is null in the case of the compiler
			if (myAnimator != null) {
				//plays the glow animation
				myAnimator.SetTrigger("playAnimation");
			}
	
			//sets the drop zone sprite to the collided sprite
			myElement.sprite = element;
			myElement.enabled = true;

			myImage.sprite = capturedIconSprite;
			//sets the name of the gameobject
			myElement.gameObject.name = myElement.sprite.name;

			//sets the name of the element and the text of element combo
			SetElementTextAndStatus(elementName, Utility.UppercaseWords(myElement.gameObject.name), true);
			if (!allElementsInZones) {
				SetElementTextAndStatus(zoneReadyText, "Loading", true);
			}

			if (mode == Mode.Crafting) {
				crafter.checkForCombination(zoneNumber);
				//updates the reference text
				setElementCountText();

				//sets the inventory bar length
				updateInventoryBarFill(PlayerPrefs.GetInt(element.name));
				if (GlobalVars.NUMBER_OF_COMBINATIONS.ContainsKey(myElement.gameObject.name)) {
					updateBioCombatBar(GlobalVars.NUMBER_OF_COMBINATIONS[myElement.gameObject.name]);
				}

				if (GlobalVars.ELEMENTS_BY_NAME.ContainsKey(myElement.gameObject.name)) {
					updateClassBar(GlobalVars.ELEMENTS_BY_NAME[myElement.gameObject.name].getTier());
				}

			} else if (mode == Mode.Gathering) {
				zoneReadyIndicator.enabled = true;

				//calls the event
				callGatheringZoneToggledEvent(true);

				gatheringControl.toggleZoneReadyGathering(this);
				//activates the element name and element combo text
				SetElementTextAndStatus(elementName, elementName.text, true);

				if (!allElementsInZones) {
					//sets the loading text to true
					SetElementTextAndStatus(zoneReadyText, "Loading", true);
				}
			}
		}
	}


	//updates the length of the bar to match the number of elements in the inventory (maxes out at 100) 
	public void updateInventoryBarFill (int elementCount) {
		if (GlobalVars.INVENTORY) {
			elementAmountBar.fillAmount = Mathf.Clamp(((float)elementCount)/100f, 0, 1f);
		} else {
			elementAmountBar.enabled = false;
		}
	}
	//updates the length of the bar to match the number of combinations an element has (maxes out at 6 (temp))
	public void updateBioCombatBar (int elementCombinations){
		if (elementCombinations > 6) {
			elementCombinations = 6;
		}
		bioCombatBar.fillAmount = (float)Math.Round(((float)elementCombinations*10)/60f, 1);
	}
	//updates the length of the bar to match the tier of the element (maxes out at 10)
	public void updateClassBar(int elementTier){
		if(elementTier > 10){
			elementTier = 10;
		}
		elementClassBar.fillAmount = elementTier * 10f / 100f;
	}

	//overloaded method to tie the function to the element crafted event call
	public void updateInventoryBarFill (string resultElement, string parentElement1, string parentElement2, bool isNew) {
		updateInventoryBarFill(PlayerPrefs.GetInt(myElement.sprite.name));
	}

	public void resetText () {
		SetElementTextAndStatus (elementName, noElement, true);
		SetElementTextAndStatus (elementCount, noElementCount, true);
		SetElementTextAndStatus(zoneReadyText, "", true);
		allElementsInZones = false;

		elementName.color = Color.white;
		elementCount.color = Color.white;
	}

	public void elementHasBeenUsed () {
		crafter.setZoneAsEmpty (zoneNumber);
		myElement.sprite = defaultIcon;
		if (myElement.sprite == null) {
			myElement.enabled = false;
		}
		if (mode == Mode.Crafting) {
			resetText();
		}
		hasCapturedElement = false;
	}

	public void setElementCountText () {
		if (GlobalVars.INVENTORY) {
			if (elementCount != null && elementName != null) {
				elementCount.text = PlayerPrefs.GetInt(myElement.sprite.name).ToString();
				if (int.Parse(elementCount.text) <= 0) {
					elementCount.color = crafter.errorColor;
					elementName.color = crafter.errorColor;
				} else {
					elementName.color = Color.white;
					elementCount.color = Color.white;
				}
			}
		} else {
			elementCount.enabled = false;
		}
	}

	//plays the animation for when the element in the zone has no elements
	public void playNoElementsAnimation () {
		if (myAnimator != null) {
			myAnimator.SetTrigger("noElements");
		}
	}

	public bool isElementCaptured () {
		return hasCapturedElement;
	}

	//sets hasCapturedElement to true
	public void elementHasBeenCapured () {
		hasCapturedElement = true;
	}

	public int getZoneNumber () {
		return zoneNumber;
	}

#region GATHERING_ONLY_FUNCTIONS
	//sets the text for when all the gathering zones have elements
	// TODO: this method is not currently being called
		// When the elements are all dragged in, the zone indiciators should all read ready
		// Debug why this function is not being called
	public void setReadyToEnterText () {
		SetElementTextAndStatus(zoneReadyText, "Ready", true);
		allElementsInZones = true;
	}

	//sets the text for when one or more of the gathering zones don't have elements
	public void setNotReadyToEnterText () {
		if (hasCapturedElement) {
			SetElementTextAndStatus(zoneReadyText, "Loading", true);
			allElementsInZones = false;
		}
	}
#endregion

	// Sets the text elements text and whether its enabled or not
	void SetElementTextAndStatus(Text element, string text, bool status){
		if(element != null){
			element.text = text;
			element.enabled = status;
		}
	}

	private void callGatheringZoneToggledEvent (bool active) {

		//sends the event to toggle off an ready indicator
		if (OnToggleGatheringZone != null) {
			OnToggleGatheringZone(transform.GetSiblingIndex(), active);
		}
	}

}
