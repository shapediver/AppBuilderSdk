import React from "react";
import { 
	IconAdjustments, 
	IconAdjustmentsHorizontal, 
	IconArrowBack, 
	IconArrowDown, 
	IconArrowForward, 
	IconArrowLeft, 
	IconArrowRight, 
	IconArrowUp,
	IconAugmentedReality,
	IconAugmentedRealityOff,
	IconBookmark,
	IconBookmarkOff,
	IconBookmarks,
	IconBookmarksOff,
	IconBooks,
	IconBooksOff,
	IconCamera,
	IconCameraOff,
	IconCopy,
	IconDots,
	IconDotsVertical,
	IconDownload,
	IconDownloadOff,
	IconFileDownload,
	IconFileExport,
	IconFileImport,
	IconKey,
	IconKeyOff,
	IconLink,
	IconLinkOff,
	IconMaximize,
	IconMaximizeOff,
	IconNetwork,
	IconNetworkOff,
	IconPencilPin,
	IconPhoto,
	IconPhotoOff,
	IconRefresh,
	IconRefreshOff,
	IconReload,
	IconReplace,
	IconSettings,
	IconShare,
	IconShare2,
	IconShare3,
	IconShareOff,
	IconUpload,
	IconUser,
	IconUserOff,
	IconUsers,
	IconVideo,
	IconVideoOff,
	IconWorld,
	IconWorldOff,
	IconZoomScan
} from "@tabler/icons-react";
import { IconTypeEnum } from "types/shapediver/icons";
import { MantineThemeComponent, useProps } from "@mantine/core";

interface Props {
	type: IconTypeEnum | undefined
}

interface StyleProps {
	size: number,
	stroke: number,
}

const defaultStyleProps: Partial<StyleProps> = {
	size: 14,
	stroke: 1,
};

type IconThemePropsType = Partial<StyleProps>;

export function IconThemeProps(props: IconThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

export default function Icon({type, ...rest} : Props) {
	
	const iconProps = useProps("Icon", defaultStyleProps, rest);
	
	switch (type) {
	case IconTypeEnum.Adjustments:
		return <IconAdjustments {...iconProps} />;
	case IconTypeEnum.AdjustmentsHorizontal:
		return <IconAdjustmentsHorizontal {...iconProps} />;
	case IconTypeEnum.ArrowBack:
		return <IconArrowBack {...iconProps} />;
	case IconTypeEnum.ArrowDown:
		return <IconArrowDown {...iconProps} />;
	case IconTypeEnum.ArrowForward:
		return <IconArrowForward {...iconProps} />;
	case IconTypeEnum.ArrowLeft:
		return <IconArrowLeft {...iconProps} />;
	case IconTypeEnum.ArrowRight:
		return <IconArrowRight {...iconProps} />;
	case IconTypeEnum.ArrowUp:
		return <IconArrowUp {...iconProps} />;
	case IconTypeEnum.AugmentedReality:
		return <IconAugmentedReality {...iconProps} />;
	case IconTypeEnum.AugmentedRealityOff:
		return <IconAugmentedRealityOff {...iconProps} />;
	case IconTypeEnum.Bookmark:
		return <IconBookmark {...iconProps} />;
	case IconTypeEnum.BookmarkOff:
		return <IconBookmarkOff {...iconProps} />;
	case IconTypeEnum.Bookmarks:
		return <IconBookmarks {...iconProps} />;
	case IconTypeEnum.BookmarksOff:
		return <IconBookmarksOff {...iconProps} />;
	case IconTypeEnum.Books:
		return <IconBooks {...iconProps} />;
	case IconTypeEnum.BooksOff:
		return <IconBooksOff {...iconProps} />;
	case IconTypeEnum.Camera:
		return <IconCamera {...iconProps} />;
	case IconTypeEnum.CameraOff:
		return <IconCameraOff {...iconProps} />;
	case IconTypeEnum.Copy:
		return <IconCopy {...iconProps} />;
	case IconTypeEnum.Dots:
		return <IconDots {...iconProps} />;
	case IconTypeEnum.DotsVertical:
		return <IconDotsVertical {...iconProps} />;
	case IconTypeEnum.Download:
		return <IconDownload {...iconProps} />;
	case IconTypeEnum.DownloadOff:
		return <IconDownloadOff {...iconProps} />;
	case IconTypeEnum.FileDownload:
		return <IconFileDownload {...iconProps} />;
	case IconTypeEnum.FileExport:
		return <IconFileExport {...iconProps} />;
	case IconTypeEnum.FileImport:
		return <IconFileImport {...iconProps} />;
	case IconTypeEnum.Key:
		return <IconKey {...iconProps} />;
	case IconTypeEnum.KeyOff:
		return <IconKeyOff {...iconProps} />;
	case IconTypeEnum.Link:
		return <IconLink {...iconProps} />;
	case IconTypeEnum.LinkOff:
		return <IconLinkOff {...iconProps} />;
	case IconTypeEnum.Maximize:
		return <IconMaximize {...iconProps} />;
	case IconTypeEnum.MaximizeOff:
		return <IconMaximizeOff {...iconProps} />;
	case IconTypeEnum.Network:
		return <IconNetwork {...iconProps} />;
	case IconTypeEnum.NetworkOff:
		return <IconNetworkOff {...iconProps} />;
	case IconTypeEnum.PencilPin:
		return <IconPencilPin {...iconProps} />;
	case IconTypeEnum.Photo:
		return <IconPhoto {...iconProps} />;
	case IconTypeEnum.PhotoOff:
		return <IconPhotoOff {...iconProps} />;
	case IconTypeEnum.Refresh:
		return <IconRefresh {...iconProps} />;
	case IconTypeEnum.RefreshOff:
		return <IconRefreshOff {...iconProps} />;
	case IconTypeEnum.Reload:
		return <IconReload {...iconProps} />;
	case IconTypeEnum.Replace:
		return <IconReplace {...iconProps} />;
	case IconTypeEnum.Settings:
		return <IconSettings {...iconProps} />;
	case IconTypeEnum.Share:
		return <IconShare {...iconProps} />;
	case IconTypeEnum.Share2:
		return <IconShare2 {...iconProps} />;
	case IconTypeEnum.Share3:
		return <IconShare3 {...iconProps} />;
	case IconTypeEnum.ShareOff:
		return <IconShareOff {...iconProps} />;
	case IconTypeEnum.Upload:
		return <IconUpload {...iconProps} />;
	case IconTypeEnum.User:
		return <IconUser {...iconProps} />;
	case IconTypeEnum.UserOff:
		return <IconUserOff {...iconProps} />;
	case IconTypeEnum.Users:
		return <IconUsers {...iconProps} />;
	case IconTypeEnum.Video:
		return <IconVideo {...iconProps} />;
	case IconTypeEnum.VideoOff:
		return <IconVideoOff {...iconProps} />;
	case IconTypeEnum.World:
		return <IconWorld {...iconProps} />;
	case IconTypeEnum.WorldOff:
		return <IconWorldOff {...iconProps} />;
	case IconTypeEnum.ZoomScan:
		return <IconZoomScan {...iconProps} />;
	default:
		return null;
	}
}
