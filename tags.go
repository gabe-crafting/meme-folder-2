package main

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// ImageTagInfo represents tag information for a single image
type ImageTagInfo struct {
	Hash string   `json:"hash"` // MD5 hash of file contents
	Tags []string `json:"tags"` // array of tags
}

// TagsData represents the structure of the tags JSON file
type TagsData struct {
	Images map[string]*ImageTagInfo `json:"images"` // map of image name -> tag info
}

const tagsFileName = ".meme-tags.json"

// calculateFileHash calculates MD5 hash of a file
func calculateFileHash(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := md5.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}

// loadTagsData loads the tags JSON file from a folder
func loadTagsData(folderPath string) (*TagsData, error) {
	tagsPath := filepath.Join(folderPath, tagsFileName)

	// If file doesn't exist, return empty tags data
	if _, err := os.Stat(tagsPath); os.IsNotExist(err) {
		return &TagsData{Images: make(map[string]*ImageTagInfo)}, nil
	}

	data, err := os.ReadFile(tagsPath)
	if err != nil {
		return nil, err
	}

	var tagsData TagsData
	if err := json.Unmarshal(data, &tagsData); err != nil {
		return nil, err
	}

	// Ensure the map is initialized
	if tagsData.Images == nil {
		tagsData.Images = make(map[string]*ImageTagInfo)
	}

	return &tagsData, nil
}

// saveTagsData saves the tags data to a JSON file in the folder
func saveTagsData(folderPath string, tagsData *TagsData) error {
	tagsPath := filepath.Join(folderPath, tagsFileName)

	data, err := json.MarshalIndent(tagsData, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(tagsPath, data, 0644)
}

// findImageByHash searches for an image in tags data by its hash
func findImageByHash(tagsData *TagsData, hash string) (string, bool) {
	for imageName, info := range tagsData.Images {
		if info.Hash == hash {
			return imageName, true
		}
	}
	return "", false
}

// getOrCreateImageInfo gets existing image info or creates new one with hash
func getOrCreateImageInfo(folderPath, imageName string, tagsData *TagsData) (*ImageTagInfo, error) {
	// Check if we already have this image
	if info, exists := tagsData.Images[imageName]; exists {
		return info, nil
	}

	// Calculate hash for new image
	imagePath := filepath.Join(folderPath, imageName)
	hash, err := calculateFileHash(imagePath)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate hash: %w", err)
	}

	// Check if this hash exists under a different name (file was renamed)
	if oldName, found := findImageByHash(tagsData, hash); found {
		// File was renamed - update the entry
		info := tagsData.Images[oldName]
		delete(tagsData.Images, oldName)
		tagsData.Images[imageName] = info
		return info, nil
	}

	// Create new entry
	info := &ImageTagInfo{
		Hash: hash,
		Tags: []string{},
	}
	tagsData.Images[imageName] = info
	return info, nil
}

// GetImageTags returns the tags for a specific image in a folder
func (a *App) GetImageTags(folderPath, imageName string) ([]string, error) {
	tagsData, err := loadTagsData(folderPath)
	if err != nil {
		return nil, err
	}

	info, err := getOrCreateImageInfo(folderPath, imageName, tagsData)
	if err != nil {
		return nil, err
	}

	return info.Tags, nil
}

// GetAllTags returns all tags for all images in a folder
func (a *App) GetAllTags(folderPath string) (map[string][]string, error) {
	tagsData, err := loadTagsData(folderPath)
	if err != nil {
		return nil, err
	}

	// Convert to simple map[string][]string for frontend
	result := make(map[string][]string)
	for imageName, info := range tagsData.Images {
		result[imageName] = info.Tags
	}

	return result, nil
}

// AddImageTag adds a tag to an image
func (a *App) AddImageTag(folderPath, imageName, tag string) error {
	tagsData, err := loadTagsData(folderPath)
	if err != nil {
		return err
	}

	info, err := getOrCreateImageInfo(folderPath, imageName, tagsData)
	if err != nil {
		return err
	}

	// Check if tag already exists
	for _, existingTag := range info.Tags {
		if existingTag == tag {
			return nil // Tag already exists, no need to add
		}
	}

	// Add the new tag
	info.Tags = append(info.Tags, tag)

	return saveTagsData(folderPath, tagsData)
}

// RemoveImageTag removes a tag from an image
func (a *App) RemoveImageTag(folderPath, imageName, tag string) error {
	tagsData, err := loadTagsData(folderPath)
	if err != nil {
		return err
	}

	info, exists := tagsData.Images[imageName]
	if !exists {
		return nil // No tags for this image
	}

	// Filter out the tag to remove
	newTags := []string{}
	for _, existingTag := range info.Tags {
		if existingTag != tag {
			newTags = append(newTags, existingTag)
		}
	}

	// If no tags left, remove the image entry
	if len(newTags) == 0 {
		delete(tagsData.Images, imageName)
	} else {
		info.Tags = newTags
	}

	return saveTagsData(folderPath, tagsData)
}

// SetImageTags sets all tags for an image (replaces existing tags)
func (a *App) SetImageTags(folderPath, imageName string, tags []string) error {
	tagsData, err := loadTagsData(folderPath)
	if err != nil {
		return err
	}

	if len(tags) == 0 {
		delete(tagsData.Images, imageName)
	} else {
		info, err := getOrCreateImageInfo(folderPath, imageName, tagsData)
		if err != nil {
			return err
		}
		info.Tags = tags
	}

	return saveTagsData(folderPath, tagsData)
}

