package dto

// PostRequest represents the post request DTO
type PostRequest struct {
	Title     string `json:"title" binding:"required,max=255" example:"My Blog Post"`
	Content   string `json:"content" binding:"required" example:"This is the content of my blog post"`
	Published bool   `json:"published" example:"true"`
	TagIDs    []int  `json:"tag_ids"`
}

// TagRequest represents the tag request DTO
type TagRequest struct {
	Name        string `json:"name" binding:"required,max=50" example:"Technology"`
	Description string `json:"description" binding:"max=255" example:"Posts about technology"`
	Color       string `json:"color" binding:"required,len=7" example:"#FF5733"` // hex color like #FF5733
}