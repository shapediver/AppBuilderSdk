
/** 
 * Types of icons 
 * @see https://tabler.io/icons
 */
export enum IconTypeEnum {
	Adjustments = "adjustments",
	AdjustmentsHorizontal = "adjustments-horizontal",
	ArrowBack = "arrow-back",
	ArrowDown = "arrow-down",
	ArrowForward = "arrow-forward",
	ArrowLeft = "arrow-left",
	ArrowRight = "arrow-right",
	ArrowUp = "arrow-up",
	AugmentedReality = "augmented-reality",
	AugmentedRealityOff = "augmented-reality-off",
	Bookmark = "bookmark",
	BookmarkOff = "bookmark-off",
	Bookmarks = "bookmarks",
	BookmarksOff = "bookmarks-off",
	Books = "books",
	BooksOff = "books-off",
	Camera = "camera",
	CameraOff = "camera-off",
	Copy = "copy",
	Dots = "dots",
	DotsVertical = "dots-vertical",
	Download = "download",
	DownloadOff = "download-off",
	FileDownload = "file-download",
	FileExport = "file-export",
	FileImport = "file-import",
	Key = "key",
	KeyOff = "key-off",
	Link = "link",
	LinkOff = "link-off",
	Maximize = "maximize",
	MaximizeOff = "maximize-off",
	Network = "network",
	NetworkOff = "network-off",
	PencilPin = "pencil-pin",
	Photo = "photo",
	PhotoOff = "photo-off",
	Refresh = "refresh",
	RefreshOff = "refresh-off",
	Reload = "reload",
	Replace = "replace",
	Settings = "settings",
	Share = "share",
	Share2 = "share-2",
	Share3 = "share-3",
	ShareOff = "share-off",
	Upload = "upload",
	User = "user",
	UserOff = "user-off",
	Users = "users",
	Video = "video",
	VideoOff = "video-off",
	World = "world",
	WorldOff = "world-off",
	ZoomScan = "zoom-scan"
}

const IconTypeEnumType = {
	...IconTypeEnum,
};

export type IconType = typeof IconTypeEnumType[keyof typeof IconTypeEnumType];
